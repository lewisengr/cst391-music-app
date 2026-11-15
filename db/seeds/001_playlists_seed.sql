-- Milestone 4: sample playlists for testing. Run after 001_playlists.sql.
-- Only inserts when the playlists table is empty, so it is safe to run more than once.
-- user_id 1 and 2 stand in for two future customer accounts.

INSERT INTO playlists (user_id, name, description)
SELECT v.user_id, v.name, v.description
FROM (VALUES
  (1, 'Road Trip', 'Upbeat Beatles songs for the car'),
  (2, 'Late Night', 'Slower songs for winding down')
) AS v (user_id, name, description)
WHERE NOT EXISTS (SELECT 1 FROM playlists);

INSERT INTO playlist_tracks (playlist_id, track_id, position)
SELECT p.id, v.track_id, v.position
FROM (VALUES
  ('Road Trip', 1, 1),
  ('Road Trip', 2, 2),
  ('Road Trip', 3, 3),
  ('Late Night', 30, 1),
  ('Late Night', 31, 2)
) AS v (playlist_name, track_id, position)
JOIN playlists p ON p.name = v.playlist_name
ON CONFLICT (playlist_id, track_id) DO NOTHING;
