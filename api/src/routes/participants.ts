import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sql from '../db/client';
import { errorResponse } from '../middleware/errorHandler';

const participants = new Hono();

const joinBody = z.object({
  display_name: z.string().min(1).max(100),
});

participants.post('/:room_code/join', zValidator('json', joinBody), async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const { display_name } = c.req.valid('json');

  const [session] = await sql`SELECT * FROM sessions WHERE room_code = ${room_code}`;
  if (!session) return errorResponse(c, 404, 'Session not found');
  if (session.status !== 'lobby') return errorResponse(c, 400, 'Session has already started');

  const [participant] = await sql`
    INSERT INTO participants (session_id, display_name)
    VALUES (${session.id}, ${display_name})
    RETURNING *
  `;
  return c.json({ participant, session }, 201);
});

export default participants;
