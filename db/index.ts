import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getDb() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL não configurada.');
  const url = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/(\.neon\.tech)\)(?=\/|$)/i, '$1');
  const sql = neon(url);
  return drizzle(sql, { schema });
}
