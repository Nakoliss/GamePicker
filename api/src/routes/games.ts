import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sql from '../db/client';
import { errorResponse } from '../middleware/errorHandler';

const games = new Hono();

const gameBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

games.get('/', async (c) => {
  const rows = await sql`SELECT * FROM games ORDER BY name ASC`;
  return c.json(rows);
});

games.post('/', zValidator('json', gameBody), async (c) => {
  const { name, description } = c.req.valid('json');
  const rows = await sql`
    INSERT INTO games (name, description) VALUES (${name}, ${description ?? null})
    RETURNING *
  `;
  return c.json(rows[0], 201);
});

games.put('/:id', zValidator('json', gameBody), async (c) => {
  const id = Number(c.req.param('id'));
  const { name, description } = c.req.valid('json');
  const rows = await sql`
    UPDATE games SET name = ${name}, description = ${description ?? null}
    WHERE id = ${id} RETURNING *
  `;
  if (rows.length === 0) return errorResponse(c, 404, 'Game not found');
  return c.json(rows[0]);
});

games.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const rows = await sql`DELETE FROM games WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) return errorResponse(c, 404, 'Game not found');
  return c.json({ deleted: true });
});

export default games;
