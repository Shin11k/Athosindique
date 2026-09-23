import { one } from '@/lib/programa';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row = await one<{ ok: number }>('SELECT 1 AS ok');
    return Response.json({
      ok: row?.ok === 1,
      database: 'neon-postgres',
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { ok: false, database: 'neon-postgres' },
      { status: 503 },
    );
  }
}
