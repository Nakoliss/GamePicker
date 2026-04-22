import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sql from '../db/client';
import { errorResponse } from '../middleware/errorHandler';
import { uniqueRoomCode } from '../utils/roomCode';

const sessions = new Hono();

const createBody = z.object({
  list_id: z.number().int().positive(),
  votes_per_round: z.number().int().min(1).max(20),
  submitter_name: z.string().min(1).max(100),
});

const nextRoundBody = z.object({
  participant_id: z.number().int().positive(),
  tied_game_ids: z.array(z.number().int().positive()).min(2),
});

sessions.post('/', zValidator('json', createBody), async (c) => {
  const { list_id, votes_per_round, submitter_name } = c.req.valid('json');

  const [list] = await sql`SELECT id FROM lists WHERE id = ${list_id}`;
  if (!list) return errorResponse(c, 404, 'List not found');

  const room_code = await uniqueRoomCode();
  const [session] = await sql`
    INSERT INTO sessions (room_code, list_id, votes_per_round)
    VALUES (${room_code}, ${list_id}, ${votes_per_round})
    RETURNING *
  `;

  const [submitter] = await sql`
    INSERT INTO participants (session_id, display_name)
    VALUES (${session.id}, ${submitter_name})
    RETURNING *
  `;

  await sql`UPDATE sessions SET submitter_id = ${submitter.id} WHERE id = ${session.id}`;

  return c.json({ session: { ...session, submitter_id: submitter.id }, participant: submitter }, 201);
});

sessions.get('/:room_code', async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const [session] = await sql`SELECT * FROM sessions WHERE room_code = ${room_code}`;
  if (!session) return errorResponse(c, 404, 'Session not found');

  const participants = await sql`
    SELECT * FROM participants WHERE session_id = ${session.id} ORDER BY joined_at ASC
  `;

  // Get games for the current round
  let games;
  if (session.current_round === 1) {
    games = await sql`
      SELECT g.* FROM games g
      JOIN list_games lg ON lg.game_id = g.id
      WHERE lg.list_id = ${session.list_id}
      ORDER BY g.name ASC
    `;
  } else {
    games = await sql`
      SELECT g.* FROM games g
      JOIN round_games rg ON rg.game_id = g.id
      WHERE rg.session_id = ${session.id} AND rg.round_number = ${session.current_round}
      ORDER BY g.name ASC
    `;
  }

  // Check how many participants have submitted votes this round
  const [voteStats] = await sql`
    SELECT COUNT(DISTINCT participant_id)::int AS voted_count
    FROM votes
    WHERE session_id = ${session.id} AND round_number = ${session.current_round}
  `;

  return c.json({
    session,
    participants,
    games,
    voted_count: voteStats.voted_count,
  });
});

sessions.post('/:room_code/start', async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const body = await c.req.json();
  const participant_id = body?.participant_id;

  const [session] = await sql`SELECT * FROM sessions WHERE room_code = ${room_code}`;
  if (!session) return errorResponse(c, 404, 'Session not found');
  if (session.submitter_id !== participant_id) return errorResponse(c, 403, 'Only the submitter can start the session');
  if (session.status !== 'lobby') return errorResponse(c, 400, 'Session already started');

  const [updated] = await sql`
    UPDATE sessions SET status = 'voting' WHERE id = ${session.id} RETURNING *
  `;
  return c.json(updated);
});

sessions.post('/:room_code/next-round', zValidator('json', nextRoundBody), async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const { participant_id, tied_game_ids } = c.req.valid('json');

  const [session] = await sql`SELECT * FROM sessions WHERE room_code = ${room_code}`;
  if (!session) return errorResponse(c, 404, 'Session not found');
  if (session.submitter_id !== participant_id) return errorResponse(c, 403, 'Only the submitter can advance rounds');

  const next_round = session.current_round + 1;

  await sql`
    INSERT INTO round_games (session_id, round_number, game_id)
    SELECT ${session.id}, ${next_round}, unnest(${tied_game_ids}::int[])
    ON CONFLICT DO NOTHING
  `;

  const [updated] = await sql`
    UPDATE sessions
    SET current_round = ${next_round}, status = 'voting'
    WHERE id = ${session.id}
    RETURNING *
  `;
  return c.json(updated);
});

sessions.post('/:room_code/complete', async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const [updated] = await sql`
    UPDATE sessions SET status = 'complete'
    WHERE room_code = ${room_code}
    RETURNING *
  `;
  if (!updated) return errorResponse(c, 404, 'Session not found');
  return c.json(updated);
});

export default sessions;
