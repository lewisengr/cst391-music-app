import { NextRequest, NextResponse } from "next/server";
import { jsonError, parseId, readJsonBody } from "@/lib/http";
import { addTrackToPlaylist } from "@/lib/playlists";

type Context = { params: Promise<{ id: string }> };

// POST /api/playlists/:id/tracks  { trackId }
// Planned access: owner only. Not enforced until the auth milestone.
export async function POST(request: NextRequest, context: Context) {
  const playlistId = parseId((await context.params).id);
  if (playlistId === null) {
    return jsonError(400, "Invalid playlist id");
  }
  const body = await readJsonBody(request);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError(400, "Request body must be a JSON object");
  }
  const trackId = parseId((body as { trackId?: unknown }).trackId);
  if (trackId === null) {
    return jsonError(400, "trackId is required and must be a positive integer");
  }

  try {
    const result = await addTrackToPlaylist(playlistId, trackId);
    switch (result.status) {
      case "playlist-not-found":
        return jsonError(404, "Playlist not found");
      case "track-not-found":
        return jsonError(404, "Track not found");
      case "duplicate":
        return jsonError(409, "Track is already in this playlist");
      case "added":
        return NextResponse.json(result.entry, {
          status: 201,
          headers: { Location: `/api/playlists/${playlistId}` },
        });
    }
  } catch (error) {
    console.error(`POST /api/playlists/${playlistId}/tracks error:`, error);
    return jsonError(500, "Failed to add track to playlist");
  }
}
