import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

type Row = Record<string, unknown>;
let sqlClient: ReturnType<typeof neon> | null = null;

function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL não configurada.');
  return raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/(\.neon\.tech)\)(?=\/|$)/i, '$1');
}

function sql() {
  if (!sqlClient) sqlClient = neon(databaseUrl());
  return sqlClient;
}

export async function query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(text, params)) as T[];
}

export async function one<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function exec(text: string, params: unknown[] = []): Promise<number> {
  const result = await sql().query(text, params, { fullResults: true }) as unknown as { rowCount?: number };
  return Number(result.rowCount ?? 0);
}

export const digits = (s: string) => s.replace(/\D/g, '');

export function cpfValid(s: string) {
  const c = digits(s);
  if (!/^\d{11}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  for (let n = 9; n < 11; n++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(c[i]) * (n + 1 - i);
    let d = (sum * 10) % 11;
    if (d === 10) d = 0;
    if (d !== Number(c[n])) return false;
  }
  return true;
}

export function field(v: unknown, label: string, min = 2, max = 160) {
  if (typeof v !== 'string' || v.trim().length < min || v.trim().length > max) {
    throw new Error('Confira ' + label + '.');
  }
  return v.trim();
}

export function normalizeEmail(v: unknown) {
  const email = field(v, 'o e-mail').toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Confira o e-mail.');
  return email;
}

export function hashPassword(password: unknown) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: unknown, salt: string, expectedHash: string) {
  if (typeof password !== 'string' || !salt || !expectedHash) return false;
  try {
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function adminSetupKey() {
  return process.env.ADMIN_SETUP_KEY || '';
}


let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const statements = [
      `CREATE TABLE IF NOT EXISTS people (
        id text PRIMARY KEY,
        name text NOT NULL,
        cpf text NOT NULL UNIQUE,
        phone text NOT NULL,
        email text NOT NULL UNIQUE,
        code text NOT NULL UNIQUE,
        parent text NULL,
        role text NOT NULL DEFAULT 'member',
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        created timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS leads (
        id text PRIMARY KEY,
        referrer text NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        parent_name text NOT NULL,
        parent_cpf text NOT NULL UNIQUE,
        parent_email text NULL,
        phone text NOT NULL,
        child_name text NULL,
        child_cpf text NULL,
        grade text NULL,
        status text NOT NULL DEFAULT 'new',
        benefit_kind text NOT NULL DEFAULT 'discount',
        discount_month text NULL,
        tuition integer NOT NULL DEFAULT 0,
        reward integer NOT NULL DEFAULT 0,
        created timestamptz NOT NULL DEFAULT now(),
        consent timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key text PRIMARY KEY,
        value text NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id text PRIMARY KEY,
        actor text NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        lead text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        action text NOT NULL,
        created timestamptz NOT NULL DEFAULT now()
      )`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS child_name text NULL`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS child_cpf text NULL`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS grade text NULL`,
      `CREATE INDEX IF NOT EXISTS leads_referrer_idx ON leads(referrer)`,
      `CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status)`,
      `CREATE INDEX IF NOT EXISTS events_lead_idx ON events(lead)`,
    ];

    for (const statement of statements) {
      await sql().query(statement);
    }
    schemaReady = true;
  })();

  try {
    await schemaPromise;
  } finally {
    if (!schemaReady) schemaPromise = null;
  }
}
