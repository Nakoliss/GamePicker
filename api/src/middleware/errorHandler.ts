import type { Context } from 'hono';

export function errorResponse(c: Context, status: number, message: string) {
  return c.json({ error: message }, status as any);
}
