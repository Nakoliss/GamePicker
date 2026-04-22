import { Hono } from 'hono';
import { z } from 'zod';
import sql from '../db/client';
import { errorResponse } from '../middleware/errorHandler';
import { computeResult } from '../utils/results';

const votes = new Hono();

const voteBody = z.object({
  participant_id: z.number().int().positive(),
  game_ids: z.array(z.number().int().positive()).min(1),
  round_number: z.number().int().positive(),
});

votes.post('/:room_code/votes', async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const parsed = voteBody.safeParse(await c.req.json());
  if (!parsed.success) return errorResponse(c, 400, parsed.error.issues[0].message);
  const { participant_id, game_ids, round_number } = parsed.data;

  const [session] = await sql`SELECT * FROM sessions WHERE room_code = ${room_code}`;
  if (!session) return errorResponse(c, 404, 'Session not found');
  if (session.status !== 'voting') return errorResponse(c, 400, 'Session is not in voting phase');
  if (game_ids.length > session.votes_per_round) {
    return errorResponse(c, 400, `You can only vote for ${session.votes_per_round} game(s)`);
  }

  await sql`
    DELETE FROM votes
    WHERE session_id = ${session.id}
      AND participant_id = ${participant_id}
      AND round_number = ${round_number}
  `;

  await sql`
    INSERT INTO votes (session_id, participant_id, game_id, round_number)
    SELECT ${session.id}, ${participant_id}, unnest(${game_ids}::int[]), ${round_number}
    ON CONFLICT DO NOTHING
  `;

  const [{ total }] = await sql`
    SELECT COUNT(*)::int AS total FROM participants WHERE session_id = ${session.id}
  `;
  const [{ voted }] = await sql`
    SELECT COUNT(DISTINCT participant_id)::int AS voted
    FROM votes WHERE session_id = ${session.id} AND round_number = ${round_number}
  `;

  if (voted >= total) {
    await sql`UPDATE sessions SET status = 'results' WHERE id = ${session.id}`;
  }

  return c.json({ submitted: true, voted, total });
});

votes.get('/:room_code/results/:round', async (c) => {
  const room_code = c.req.param('room_code').toUpperCase();
  const round = Number(c.req.param('round'));

  const [session] = await sql`SELECT * FROM sessions WHERE room_code = ${room_code}`;
  if (!session) return errorResponse(c, 404, 'Session not found');

  const tallies = await sql`
    SELECT v.game_id, g.name AS game_name, COUNT(*)::int AS vote_count
    FROM votes v
    JOIN games g ON g.id = v.game_id
    WHERE v.session_id = ${session.id} AND v.round_number = ${round}
    GROUP BY v.game_id, g.name
    ORDER BY vote_count DESC
  `;

  const [{ participant_count }] = await sql`
    SELECT COUNT(*)::int AS participant_count FROM participants WHERE session_id = ${session.id}
  `;
  const [{ votes_submitted }] = await sql`
    SELECT COUNT(DISTINCT participant_id)::int AS votes_submitted
    FROM votes WHERE session_id = ${session.id} AND round_number = ${round}
  `;

  const result = computeResult(tallies as any, participant_count, votes_submitted);
  return c.json(result);
});

export default votes;
