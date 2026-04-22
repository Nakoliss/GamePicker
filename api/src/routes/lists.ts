import { Hono } from 'hono';
import { z } from 'zod';
import sql from '../db/client';
import { errorResponse } from '../middleware/errorHandler';

const lists = new Hono();

const listBody = z.object({
  name: z.string().min(1).max(200),
  game_ids: z.array(z.number().int().positive()).min(1),
});

lists.get('/', async (c) => {
  const rows = await sql`
    SELECT l.*, COUNT(lg.game_id)::int AS game_count
    FROM lists l
    LEFT JOIN list_games lg ON lg.list_id = l.id
    GROUP BY l.id
    ORDER BY l.name ASC
  `;
  return c.json(rows);
});

lists.post('/', async (c) => {
  const parsed = listBody.safeParse(await c.req.json());
  if (!parsed.success) return errorResponse(c, 400, parsed.error.issues[0].message);
  const { name, game_ids } = parsed.data;
  const [list] = await sql`INSERT INTO lists (name) VALUES (${name}) RETURNING *`;
  await sql`
    INSERT INTO list_games (list_id, game_id)
    SELECT ${list.id}, unnest(${game_ids}::int[])
    ON CONFLICT DO NOTHING
  `;
  return c.json({ ...list, game_ids }, 201);
});

lists.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const [list] = await sql`SELECT * FROM lists WHERE id = ${id}`;
  if (!list) return errorResponse(c, 404, 'List not found');
  const games = await sql`
    SELECT g.* FROM games g
    JOIN list_games lg ON lg.game_id = g.id
    WHERE lg.list_id = ${id}
    ORDER BY g.name ASC
  `;
  return c.json({ ...list, games });
});

lists.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const parsed = listBody.safeParse(await c.req.json());
  if (!parsed.success) return errorResponse(c, 400, parsed.error.issues[0].message);
  const { name, game_ids } = parsed.data;
  const rows = await sql`UPDATE lists SET name = ${name} WHERE id = ${id} RETURNING *`;
  if (rows.length === 0) return errorResponse(c, 404, 'List not found');
  await sql`DELETE FROM list_games WHERE list_id = ${id}`;
  await sql`
    INSERT INTO list_games (list_id, game_id)
    SELECT ${id}, unnest(${game_ids}::int[])
    ON CONFLICT DO NOTHING
  `;
  return c.json({ ...rows[0], game_ids });
});

lists.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const rows = await sql`DELETE FROM lists WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) return errorResponse(c, 404, 'List not found');
  return c.json({ deleted: true });
});

export default lists;
