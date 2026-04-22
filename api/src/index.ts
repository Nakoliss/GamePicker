import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import games from './routes/games';
import lists from './routes/lists';
import sessions from './routes/sessions';
import participants from './routes/participants';
import votes from './routes/votes';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/health', (c) => c.json({ ok: true }));

app.route('/games', games);
app.route('/lists', lists);
app.route('/sessions', sessions);
app.route('/sessions', participants);
app.route('/sessions', votes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = Number(process.env.PORT ?? 3000);
console.log(`GamePicker API running on port ${port}`);

serve({ fetch: app.fetch, port });
