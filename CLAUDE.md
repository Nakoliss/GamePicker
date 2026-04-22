# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

From the repo root:

```bash
npm run api        # start API dev server (tsx watch, hot-reload)
npm run mobile     # start Expo dev server (scan QR with Expo Go)
```

Within `api/`:
```bash
npx tsc --noEmit   # type-check (no test suite yet)
npm run build      # compile to dist/
npm start          # run compiled dist/index.js
```

Within `mobile/`:
```bash
npx tsc --noEmit   # type-check
```

No test suite exists yet. TypeScript is the primary correctness check.

## Environment setup

**`api/.env`** (copy from `.env.example`):
```
DATABASE_URL=postgresql://...?sslmode=require
PORT=3000
```

**`mobile/.env`** (copy from `.env.example`):
```
EXPO_PUBLIC_API_URL=http://<local-machine-IP>:3000
```
Use the machine's LAN IP, not `localhost` — phones on the same WiFi need to reach the API.

Run the schema once on NeonDB: paste `api/src/db/schema.sql` into the NeonDB SQL editor.

## Architecture

npm workspaces monorepo with two packages: `api/` and `mobile/`.

### API (`api/`)

Hono framework on Node.js, connecting to NeonDB (serverless PostgreSQL) via the `@neondatabase/serverless` tagged-template driver (`sql\`...\``). No ORM — all queries are raw SQL inline in route handlers.

All routes use `schema.safeParse(await c.req.json())` for validation (plain Zod, no middleware). `@hono/zod-validator` is intentionally excluded due to type incompatibility with zod 3.25.x.

Route files map to REST resources. Three route files are all mounted at `/sessions` in `index.ts`:
- `sessions.ts` — session lifecycle (create, get state, start, next-round, complete)
- `participants.ts` — `POST /sessions/:room_code/join`
- `votes.ts` — `POST /sessions/:room_code/votes` and `GET /sessions/:room_code/results/:round`

`GET /sessions/:room_code` is the **primary polling endpoint** — it returns `{ session, participants, games, voted_count }` in a single response and drives all real-time screen transitions in the mobile app.

### Mobile (`mobile/`)

Expo (React Native) with react-native-paper (Material Design 3) for UI and React Navigation (native stack) for routing.

**Real-time pattern:** No WebSockets. `usePoll` (`src/hooks/usePoll.ts`) runs a fetch on an interval, guards against concurrent requests with an `isInflight` ref, and pauses automatically when the app goes to background via `AppState`. Lobby polls every 2.5s, Voting polls every 3s, Results does not poll.

**Session identity:** When a user creates or joins a session, `useSessionStore` (Zustand) stores `participantId`, `sessionId`, `roomCode`, `isSubmitter`, `submitterId`, and `votesPerRound`. This is the only global state — all other data comes from the polling hook. `clearSession()` is called on session completion to reset to home.

**Screen flow:**
```
Home → StartSession → Lobby → Voting → Results
     → JoinSession  ↗
```
Lobby, Voting, and Results use `headerBackVisible: false` — navigation between them is always done with `navigation.replace()` (triggered by polling detecting a status change), never the back button.

**API layer:** `mobile/src/api/client.ts` is a thin fetch wrapper that prepends `EXPO_PUBLIC_API_URL`. Each entity has its own typed file (`games.ts`, `lists.ts`, `sessions.ts`).

### Data model

```
games ←── list_games ──→ lists
                              ↓
                          sessions (room_code, status, current_round, votes_per_round)
                              ↓
                        participants
                              ↓
                            votes (session_id, participant_id, game_id, round_number)
                         round_games (tie-breaker pools for round ≥ 2)
```

Session status machine: `lobby → voting → results → voting → ... → complete`

Round 1 game pool comes from `list_games`. Round 2+ pools are stored in `round_games` (populated by `POST /sessions/:room_code/next-round` with the tied game IDs). Vote submission auto-flips status to `results` when all participants have voted in the current round.

Room codes are 6 characters from an unambiguous alphabet (no 0/O/1/I/L). Generated in `api/src/utils/roomCode.ts` with a uniqueness check loop.

The `UNIQUE` constraint on `votes(session_id, participant_id, game_id, round_number)` makes vote submission idempotent — the route deletes then re-inserts, so retries are safe.
