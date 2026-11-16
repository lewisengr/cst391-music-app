import { NextRequest } from "next/server";
import { jsonError, noContent, parseId } from "@/lib/http";
import { removeTrackFromPlaylist } from "@/lib/playlists";

type Context = { params: Promise<{ id: string; trackId: string }> };

// DELETE /api/playlists/:id/tracks/:trackId
export async function DELETE(_request: NextRequest, context: Context) {
  const params = await context.params;
  const playlistId = parseId(params.id);
  const trackId = parseId(params.trackId);

  if (playlistId === null || trackId === null) {
    return jsonError(400, "Invalid playlist id or track id");
  }

  try {
    const result = await removeTrackFromPlaylist(playlistId, trackId);
    if (result === "playlist-not-found") {
      return jsonError(404, "Playlist not found");
    }
    if (result === "entry-not-found") {
      return jsonError(404, "Track is not in this playlist");
    }
    return noContent();
  } catch (error) {
    console.error(
      `DELETE /api/playlists/${playlistId}/tracks/${trackId} error:`,
      error,
    );
    return jsonError(500, "Failed to remove track from playlist");
  }
}
