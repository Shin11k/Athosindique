import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'athos_session';
const MAX_AGE = 60 * 60 * 24 * 30;

type Payload = { userId: string; exp: number };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 24) throw new Error('SESSION_SECRET não configurado.');
  return value;
}

function encode(payload: Payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function signature(encoded: string) {
  return createHmac('sha256', secret()).update(encoded).digest('base64url');
}

function verifySignature(encoded: string, received: string) {
  const a = Buffer.from(signature(encoded));
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getSession(): Promise<Payload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [encoded, received] = token.split('.');
  if (!encoded || !received || !verifySignature(encoded, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Payload;
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const store = await cookies();
  const encoded = encode({ userId, exp: Date.now() + MAX_AGE * 1000 });
  store.set(COOKIE_NAME, encoded + '.' + signature(encoded), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
