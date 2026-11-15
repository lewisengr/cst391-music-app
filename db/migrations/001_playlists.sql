-- Milestone 4: playlists feature
-- Safe to run more than once. Apply to both the local and the hosted (Neon) music database.

-- One row per playlist. user_id is the future owner; it becomes a foreign key to
-- users(id) once the user system exists, so it is nullable and unconstrained for now.
CREATE TABLE IF NOT EXISTS playlists (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT playlists_name_not_blank CHECK (btrim(name) <> '')
);

CREATE INDEX IF NOT EXISTS playlists_user_id_idx ON playlists (user_id);

-- Join table: a playlist holds many tracks and a track can be on many playlists.
-- Deleting a playlist, or a track (including through its album), removes its entries.
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id          SERIAL PRIMARY KEY,
  playlist_id INTEGER NOT NULL REFERENCES playlists (id) ON DELETE CASCADE,
  track_id    INTEGER NOT NULL REFERENCES tracks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  position    INTEGER NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT playlist_tracks_position_positive CHECK (position > 0),
  CONSTRAINT playlist_tracks_playlist_track_unique UNIQUE (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS playlist_tracks_track_id_idx ON playlist_tracks (track_id);
