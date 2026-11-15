import { getPool } from "@/lib/db";
import { parseId } from "@/lib/http";
import { Playlist, PlaylistTrack } from "@/lib/types";

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export interface PlaylistInput {
  name: string;
  description: string | null;
  userId: number | null;
}

type Validation<T> = { value: T } | { error: string };

// Checks a create (allowUserId) or update request body.
export function validatePlaylistInput(
  body: unknown,
  { allowUserId }: { allowUserId: boolean },
): Validation<PlaylistInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }
  const { name, description, userId } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    return { error: "name is required" };
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    return { error: `name must be ${NAME_MAX_LENGTH} characters or fewer` };
  }

  let cleanDescription: string | null = null;
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      return { error: "description must be a string" };
    }
    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      return {
        error: `description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`,
      };
    }
    cleanDescription = description.trim() || null;
  }

  let ownerId: number | null = null;
  if (allowUserId && userId !== undefined && userId !== null) {
    ownerId = parseId(userId);
    if (ownerId === null) {
      return { error: "userId must be a positive integer" };
    }
  }

  return {
    value: { name: name.trim(), description: cleanDescription, userId: ownerId },
  };
}

interface PlaylistRow {
  id: number;
  user_id: number | null;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  track_count?: number;
}

interface PlaylistTrackRow {
  track_id: number;
  position: number;
  title: string;
  number: number;
  album_id: number;
  album_title: string;
  artist: string;
  added_at: Date;
}

function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ...(row.track_count === undefined ? {} : { trackCount: row.track_count }),
  };
}

function toPlaylistTrack(row: PlaylistTrackRow): PlaylistTrack {
  return {
    trackId: row.track_id,
    position: row.position,
    title: row.title,
    number: row.number,
    albumId: row.album_id,
    albumTitle: row.album_title,
    artist: row.artist,
    addedAt: row.added_at.toISOString(),
  };
}

const PLAYLIST_COLUMNS =
  "id, user_id, name, description, created_at, updated_at";

export async function listPlaylists(userId: number | null): Promise<Playlist[]> {
  const res = await getPool().query<PlaylistRow>(
    `SELECT p.id, p.user_id, p.name, p.description, p.created_at, p.updated_at,
            COUNT(pt.id)::int AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
      WHERE $1::int IS NULL OR p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at, p.id`,
    [userId],
  );
  return res.rows.map(toPlaylist);
}

export async function getPlaylist(id: number): Promise<Playlist | null> {
  const pool = getPool();
  const playlistRes = await pool.query<PlaylistRow>(
    `SELECT ${PLAYLIST_COLUMNS} FROM playlists WHERE id = $1`,
    [id],
  );
  if (playlistRes.rowCount === 0) {
    return null;
  }

  const tracksRes = await pool.query<PlaylistTrackRow>(
    `SELECT pt.track_id, pt.position, pt.added_at,
            t.title, t.number, t.album_id, a.title AS album_title, a.artist
       FROM playlist_tracks pt
       JOIN tracks t ON t.id = pt.track_id
       JOIN albums a ON a.id = t.album_id
      WHERE pt.playlist_id = $1
      ORDER BY pt.position`,
    [id],
  );

  const tracks = tracksRes.rows.map(toPlaylistTrack);
  return {
    ...toPlaylist(playlistRes.rows[0]),
    trackCount: tracks.length,
    tracks,
  };
}

export async function createPlaylist(input: PlaylistInput): Promise<Playlist> {
  const res = await getPool().query<PlaylistRow>(
    `INSERT INTO playlists (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING ${PLAYLIST_COLUMNS}`,
    [input.userId, input.name, input.description],
  );
  return { ...toPlaylist(res.rows[0]), trackCount: 0, tracks: [] };
}

export async function updatePlaylist(
  id: number,
  input: Omit<PlaylistInput, "userId">,
): Promise<Playlist | null> {
  const res = await getPool().query<PlaylistRow>(
    `UPDATE playlists
        SET name = $2, description = $3, updated_at = now()
      WHERE id = $1
      RETURNING ${PLAYLIST_COLUMNS}`,
    [id, input.name, input.description],
  );
  return res.rowCount === 0 ? null : toPlaylist(res.rows[0]);
}

// Track entries are removed by ON DELETE CASCADE.
export async function deletePlaylist(id: number): Promise<boolean> {
  const res = await getPool().query("DELETE FROM playlists WHERE id = $1", [
    id,
  ]);
  return res.rowCount !== 0;
}

export type AddTrackResult =
  | { status: "added"; entry: PlaylistTrack }
  | { status: "playlist-not-found" }
  | { status: "track-not-found" }
  | { status: "duplicate" };

// Appends a track to the end of a playlist. The playlist row is locked so two
// requests adding at the same time cannot both take the same position.
export async function addTrackToPlaylist(
  playlistId: number,
  trackId: number,
): Promise<AddTrackResult> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const playlist = await client.query(
      "SELECT id FROM playlists WHERE id = $1 FOR UPDATE",
      [playlistId],
    );
    if (playlist.rowCount === 0) {
      await client.query("ROLLBACK");
      return { status: "playlist-not-found" };
    }

    const track = await client.query("SELECT id FROM tracks WHERE id = $1", [
      trackId,
    ]);
    if (track.rowCount === 0) {
      await client.query("ROLLBACK");
      return { status: "track-not-found" };
    }

    const inserted = await client.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position)
       SELECT $1, $2, COALESCE(MAX(position), 0) + 1
         FROM playlist_tracks
        WHERE playlist_id = $1
       ON CONFLICT (playlist_id, track_id) DO NOTHING
       RETURNING id`,
      [playlistId, trackId],
    );
    if (inserted.rowCount === 0) {
      await client.query("ROLLBACK");
      return { status: "duplicate" };
    }

    await client.query(
      "UPDATE playlists SET updated_at = now() WHERE id = $1",
      [playlistId],
    );

    const entry = await client.query<PlaylistTrackRow>(
      `SELECT pt.track_id, pt.position, pt.added_at,
              t.title, t.number, t.album_id, a.title AS album_title, a.artist
         FROM playlist_tracks pt
         JOIN tracks t ON t.id = pt.track_id
         JOIN albums a ON a.id = t.album_id
        WHERE pt.id = $1`,
      [inserted.rows[0].id],
    );

    await client.query("COMMIT");
    return { status: "added", entry: toPlaylistTrack(entry.rows[0]) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type RemoveTrackResult = "removed" | "playlist-not-found" | "entry-not-found";

export async function removeTrackFromPlaylist(
  playlistId: number,
  trackId: number,
): Promise<RemoveTrackResult> {
  const pool = getPool();
  const res = await pool.query(
    "DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2",
    [playlistId, trackId],
  );
  if (res.rowCount !== 0) {
    await pool.query("UPDATE playlists SET updated_at = now() WHERE id = $1", [
      playlistId,
    ]);
    return "removed";
  }

  const playlist = await pool.query("SELECT 1 FROM playlists WHERE id = $1", [
    playlistId,
  ]);
  return playlist.rowCount === 0 ? "playlist-not-found" : "entry-not-found";
}
