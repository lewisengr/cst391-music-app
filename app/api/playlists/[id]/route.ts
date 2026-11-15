import { NextRequest, NextResponse } from "next/server";
import { jsonError, noContent, parseId, readJsonBody } from "@/lib/http";
import {
  deletePlaylist,
  getPlaylist,
  updatePlaylist,
  validatePlaylistInput,
} from "@/lib/playlists";

type Context = { params: Promise<{ id: string }> };

// GET /api/playlists/:id
// Planned access: owner or admin. Not enforced until the auth milestone.
export async function GET(_request: NextRequest, context: Context) {
  const id = parseId((await context.params).id);
  if (id === null) {
    return jsonError(400, "Invalid playlist id");
  }

  try {
    const playlist = await getPlaylist(id);
    if (!playlist) {
      return jsonError(404, "Playlist not found");
    }
    return NextResponse.json(playlist);
  } catch (error) {
    console.error(`GET /api/playlists/${id} error:`, error);
    return jsonError(500, "Failed to fetch playlist");
  }
}

// PUT /api/playlists/:id  { name, description? }
// Planned access: owner only; admins cannot edit. Not enforced until the auth milestone.
export async function PUT(request: NextRequest, context: Context) {
  const id = parseId((await context.params).id);
  if (id === null) {
    return jsonError(400, "Invalid playlist id");
  }
  const body = await readJsonBody(request);
  if (body === undefined) {
    return jsonError(400, "Invalid JSON body");
  }
  const input = validatePlaylistInput(body, { allowUserId: false });
  if ("error" in input) {
    return jsonError(400, input.error);
  }

  try {
    const playlist = await updatePlaylist(id, input.value);
    if (!playlist) {
      return jsonError(404, "Playlist not found");
    }
    return NextResponse.json(playlist);
  } catch (error) {
    console.error(`PUT /api/playlists/${id} error:`, error);
    return jsonError(500, "Failed to update playlist");
  }
}

// DELETE /api/playlists/:id
// Planned access: owner or admin. Not enforced until the auth milestone.
export async function DELETE(_request: NextRequest, context: Context) {
  const id = parseId((await context.params).id);
  if (id === null) {
    return jsonError(400, "Invalid playlist id");
  }

  try {
    if (!(await deletePlaylist(id))) {
      return jsonError(404, "Playlist not found");
    }
    return noContent();
  } catch (error) {
    console.error(`DELETE /api/playlists/${id} error:`, error);
    return jsonError(500, "Failed to delete playlist");
  }
}
