CREATE TABLE IF NOT EXISTS games (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lists (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_games (
  list_id INT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, game_id)
);

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('lobby', 'voting', 'results', 'complete');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
  id              SERIAL PRIMARY KEY,
  room_code       CHAR(6)        NOT NULL UNIQUE,
  list_id         INT            NOT NULL REFERENCES lists(id),
  votes_per_round INT            NOT NULL DEFAULT 1,
  status          session_status NOT NULL DEFAULT 'lobby',
  current_round   INT            NOT NULL DEFAULT 1,
  submitter_id    INT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON sessions(room_code);

CREATE TABLE IF NOT EXISTS participants (
  id           SERIAL PRIMARY KEY,
  session_id   INT  NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id             SERIAL PRIMARY KEY,
  session_id     INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  game_id        INT NOT NULL REFERENCES games(id),
  round_number   INT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, participant_id, game_id, round_number)
);

CREATE TABLE IF NOT EXISTS round_games (
  session_id   INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  game_id      INT NOT NULL REFERENCES games(id),
  PRIMARY KEY (session_id, round_number, game_id)
);
