import { clearSession } from '@/lib/session';

export async function GET(req: Request) {
  await clearSession();
  return Response.redirect(new URL('/', req.url), 303);
}
