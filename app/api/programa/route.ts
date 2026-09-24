import { clearSession, getSession, setSession } from '@/lib/session';
import {
  adminSetupKey,
  cpfValid,
  ensureSchema,
  digits,
  exec,
  field,
  hashPassword,
  normalizeEmail,
  one,
  query,
  verifyPassword,
} from '@/lib/programa';

export const dynamic = 'force-dynamic';

type Row = Record<string, any>;

const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

async function currentPerson() {
  const session = await getSession();
  if (!session) return null;
  return one<Row>('SELECT * FROM people WHERE id = $1', [session.userId]);
}

async function hasAdmin() {
  return !!(await one('SELECT id FROM people WHERE role = $1 LIMIT 1', ['admin']));
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (code) {
      const person = await one<Row>(
        'SELECT name, code FROM people WHERE code = $1',
        [code],
      );
      return person
        ? json(person)
        : json({ error: 'Este link não foi encontrado.' }, 404);
    }

    const person = await currentPerson();
    const adminExists = await hasAdmin();

    if (!person) {
      return json({ signedIn: false, hasAdmin: adminExists });
    }

    const admin = person.role === 'admin';

    const leads = admin
      ? await query<Row>(
          `SELECT l.*, p.name AS referrer_name
           FROM leads l
           JOIN people p ON p.id = l.referrer
           ORDER BY l.created DESC`,
        )
      : await query<Row>(
          `SELECT id, parent_name, parent_email, phone, status, reward, tuition,
                  benefit_kind, discount_month, created
           FROM leads
           WHERE referrer = $1
           ORDER BY created DESC`,
          [person.id],
        );

    const people = admin
      ? await query<Row>(
          'SELECT id, name, parent, code, phone, email, cpf, created FROM people ORDER BY created',
        )
      : [];

    const tuition = await one<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'tuition'",
    );

    return json({
      signedIn: true,
      person,
      leads,
      people,
      tuition: Number(tuition?.value || 0),
      discountPercent: 50,
      hasAdmin: adminExists,
    });
  } catch (error) {
    console.error(error);
    return json(
      { error: 'Não foi possível carregar os dados. Tente novamente.' },
      503,
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const origin = req.headers.get('origin');
    if (origin) {
      let validOrigin = false;
      try {
        const originUrl = new URL(origin);
        const forwardedHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
          .split(',')[0]
          .trim();
        const forwardedProto = (req.headers.get('x-forwarded-proto') || '')
          .split(',')[0]
          .trim();

        if (forwardedHost) {
          validOrigin =
            originUrl.host === forwardedHost &&
            (!forwardedProto || originUrl.protocol === forwardedProto + ':');
        } else {
          validOrigin = originUrl.origin === new URL(req.url).origin;
        }
      } catch {
        validOrigin = false;
      }

      if (!validOrigin) {
        return json({ error: 'Origem inválida.' }, 403);
      }
    }

    if (Number(req.headers.get('content-length') || 0) > 16000) {
      return json({ error: 'Dados muito extensos.' }, 413);
    }

    const body = (await req.json()) as Row;
    const now = new Date().toISOString();

    if (body.action === 'login') {
      const email = normalizeEmail(body.email);
      const password = body.password;

      const person = await one<Row>(
        `SELECT id, password_hash, password_salt
         FROM people
         WHERE lower(email) = lower($1)
         LIMIT 1`,
        [email],
      );

      if (
        !person ||
        !verifyPassword(password, person.password_salt, person.password_hash)
      ) {
        return json({ error: 'E-mail ou senha inválidos.' }, 401);
      }

      await setSession(person.id);
      return json({ ok: true });
    }

    if (body.action === 'logout') {
      await clearSession();
      return json({ ok: true });
    }

    if (body.action === 'register') {
      const existing = await currentPerson();
      if (existing) return json({ error: 'Você já está conectado.' }, 409);

      const name = field(body.name, 'o nome');
      const cpf = digits(field(body.cpf, 'o CPF'));
      const phone = digits(field(body.phone, 'o telefone'));
      const email = normalizeEmail(body.email);
      const { salt, hash } = hashPassword(body.password);

      if (
        !cpfValid(cpf) ||
        !/^\d{10,11}$/.test(phone) ||
        body.consent !== true
      ) {
        throw new Error('Confira CPF, telefone, e-mail e autorização.');
      }

      let parent: string | null = null;
      let role = 'member';

      if (body.adminSetup) {
        const expectedKey = adminSetupKey();
        if (!expectedKey || body.adminKey !== expectedKey) {
          return json({ error: 'Chave de configuração inválida.' }, 403);
        }
        role = 'admin';
      } else {
        const sponsor = await one<{ id: string }>(
          'SELECT id FROM people WHERE code = $1',
          [String(body.code || '')],
        );
        if (!sponsor) throw new Error('Use um convite válido para participar.');
        parent = sponsor.id;
      }

      const id = crypto.randomUUID();
      const code = crypto.randomUUID().replaceAll('-', '');

      const inserted = await query<{ id: string }>(
        `INSERT INTO people
          (id, name, cpf, phone, email, code, parent, role, password_hash, password_salt, created)
         SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
         WHERE $8 <> 'admin'
            OR NOT EXISTS (SELECT 1 FROM people WHERE role = 'admin')
         RETURNING id`,
        [id, name, cpf, phone, email, code, parent, role, hash, salt, now],
      );

      if (!inserted.length) {
        throw new Error('O administrador já foi configurado.');
      }

      await setSession(id);
      return json({ ok: true });
    }

    if (body.action === 'lead') {
      const sponsor = await one<{ id: string }>(
        'SELECT id FROM people WHERE code = $1',
        [String(body.code || '')],
      );

      if (!sponsor) throw new Error('Link de indicação inválido.');

      const parentName = field(body.parentName, 'o nome do responsável');
      const parentCpf = digits(field(body.parentCpf, 'o CPF do responsável'));
      const phone = digits(field(body.phone, 'o telefone'));
      const parentEmail =
        typeof body.parentEmail === 'string' && body.parentEmail.trim()
          ? normalizeEmail(body.parentEmail)
          : null;
      const childName = field(body.childName, 'o nome da criança');
      const childCpf = digits(field(body.childCpf, 'o CPF da criança'));
      const grade = field(body.grade, 'a série da criança');
      const allowedGrades = new Set([
        'Educação Infantil',
        '1º ano',
        '2º ano',
        '3º ano',
        '4º ano',
        '5º ano',
        '6º ano',
        '7º ano',
        '8º ano',
        '9º ano',
      ]);

      if (
        !cpfValid(parentCpf) ||
        !cpfValid(childCpf) ||
        !/^\d{10,11}$/.test(phone) ||
        !allowedGrades.has(grade) ||
        body.consent !== true
      ) {
        throw new Error('Confira os dados do responsável, da criança e a autorização.');
      }

      const inserted = await query<{ id: string }>(
        `INSERT INTO leads
          (id, referrer, parent_name, parent_cpf, parent_email, phone,
           child_name, child_cpf, grade, status,
           benefit_kind, tuition, reward, created, consent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new','discount',0,0,$10,$10)
         ON CONFLICT (parent_cpf) DO NOTHING
         RETURNING id`,
        [
          crypto.randomUUID(),
          sponsor.id,
          parentName,
          parentCpf,
          parentEmail,
          phone,
          childName,
          childCpf,
          grade,
          now,
        ],
      );

      if (!inserted.length) {
        return json(
          {
            error:
              'Este responsável já foi indicado. A indicação original foi preservada.',
          },
          409,
        );
      }

      return json({ ok: true });
    }

    const person = await currentPerson();
    if (!person || person.role !== 'admin') {
      return json({ error: 'Acesso restrito ao administrador.' }, 403);
    }

    if (body.action === 'tuition') {
      const value = Number(body.value);
      if (!Number.isFinite(value) || value < 0 || value > 100000) {
        throw new Error('Informe um valor entre R$ 0 e R$ 100.000.');
      }

      await exec(
        `INSERT INTO settings(key, value)
         VALUES ('tuition', $1)
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value`,
        [String(Math.round(value * 100))],
      );

      return json({ ok: true });
    }

    if (body.action === 'status') {
      if (
        !['new', 'contact', 'enrolled', 'discount_applied', 'cancelled'].includes(
          body.status,
        )
      ) {
        throw new Error('Status inválido.');
      }

      const lead = await one<Row>('SELECT * FROM leads WHERE id = $1', [
        String(body.id),
      ]);

      if (!lead) throw new Error('Indicação não encontrada.');

      if (['paid', 'discount_applied'].includes(lead.status)) {
        if (body.status === lead.status) return json({ ok: true });
        throw new Error('Um benefício já concluído não pode ser alterado.');
      }

      if (
        body.status === lead.status &&
        !(body.status === 'enrolled' && lead.benefit_kind !== 'discount')
      ) {
        return json({ ok: true });
      }

      let monthly = Number(lead.tuition || 0);
      let reward = Number(lead.reward || 0);
      let month = lead.discount_month as string | null;
      let kind = String(lead.benefit_kind || 'discount');

      if (body.status === 'enrolled') {
        const entered = Number(body.referrerTuition);
        if (!Number.isFinite(entered) || entered <= 0 || entered > 100000) {
          throw new Error('Informe a mensalidade de quem fez a indicação.');
        }

        month = String(body.discountMonth || '');
        if (!/^(20[2-9][0-9])-(0[1-9]|1[0-2])$/.test(month)) {
          throw new Error('Informe o mês da próxima mensalidade do indicador.');
        }

        monthly = Math.round(entered * 100);
        reward = Math.round(monthly / 2);
        kind = 'discount';
      } else if (body.status === 'discount_applied') {
        if (
          lead.status !== 'enrolled' ||
          kind !== 'discount' ||
          !month
        ) {
          throw new Error(
            'Confirme o desconto na mensalidade do indicador antes de aplicá-lo.',
          );
        }
      } else {
        monthly = 0;
        reward = 0;
        month = null;
        kind = 'discount';
      }

      const changed = await query<{ lead: string }>(
        `WITH updated AS (
           UPDATE leads
           SET status = $1,
               reward = $2,
               tuition = $3,
               benefit_kind = $4,
               discount_month = $5
           WHERE id = $6 AND status = $7
           RETURNING id
         )
         INSERT INTO events(id, actor, lead, action, created)
         SELECT $8, $9, id, $10, $11
         FROM updated
         RETURNING lead`,
        [
          body.status,
          reward,
          monthly,
          kind,
          month,
          lead.id,
          lead.status,
          crypto.randomUUID(),
          person.id,
          body.status,
          now,
        ],
      );

      if (!changed.length) {
        return json(
          {
            error:
              'A indicação foi atualizada em outra sessão. Recarregue o painel.',
          },
          409,
        );
      }

      return json({ ok: true });
    }

    return json({ error: 'Ação desconhecida.' }, 400);
  } catch (error: any) {
    console.error(error);

    if (error?.code === '23505') {
      return json(
        { error: 'Este CPF ou e-mail já está cadastrado.' },
        409,
      );
    }

    if (error?.code === '42P01') {
      return json(
        { error: 'O banco Neon ainda não foi inicializado.' },
        503,
      );
    }

    const message =
      error instanceof Error ? error.message : 'Confira os dados e tente novamente.';

    return json({ error: message || 'Confira os dados e tente novamente.' }, 400);
  }
}
