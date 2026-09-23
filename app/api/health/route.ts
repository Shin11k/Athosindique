import { ensureSchema, one } from '@/lib/programa';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();
    const row = await one<{ ok: number | string }>('SELECT 1 AS ok');
    return Response.json({
      ok: String(row?.ok) === '1',
      database: 'neon-postgres',
      schema: 'ready',
      time: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(error);
    return Response.json(
      {
        ok: false,
        database: 'neon-postgres',
        error: error?.message || 'database connection failed',
        code: error?.code || null,
      },
      { status: 503 },
    );
  }
}
