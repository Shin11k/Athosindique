import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('DATABASE_URL não configurada.');
  process.exit(1);
}

const url = rawUrl
  .trim()
  .replace(/^["'`]+|["'`]+$/g, '')
  .replace(/(\.neon\.tech)\)(?=\/|$)/i, '$1');

const here = dirname(fileURLToPath(import.meta.url));
const sqlFile = resolve(here, '../migrations/0001_neon_postgres.sql');
const source = await readFile(sqlFile, 'utf8');
const statements = source
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const sql = neon(url);

for (const statement of statements) {
  await sql.query(statement);
}

console.log('Neon PostgreSQL inicializado com sucesso.');
