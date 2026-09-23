import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

type Row = Record<string, unknown>;
let sqlClient: ReturnType<typeof neon> | null = null;

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada.');
  if (!sqlClient) sqlClient = neon(url);
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
