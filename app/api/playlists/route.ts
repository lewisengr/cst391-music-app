import { NextRequest, NextResponse } from "next/server";
import { jsonError, parseId, readJsonBody } from "@/lib/http";
import {
  createPlaylist,
  listPlaylists,
  validatePlaylistInput,
} from "@/lib/playlists";

// GET /api/playlists?userId=
// Planned access: customer sees only their own playlists, admin sees all
export async function GET(request: NextRequest) {
  const userIdParam = request.nextUrl.searchParams.get("userId");
  let userId: number | null = null;

  if (userIdParam !== null) {
    userId = parseId(userIdParam);

    if (userId === null) {
      return jsonError(400, "userId must be a positive integer");
    }
  }

  try {
    return NextResponse.json(await listPlaylists(userId));
  } catch (error) {
    console.error("GET /api/playlists error:", error);
    return jsonError(500, "Failed to fetch playlists");
  }
}

// POST /api/playlists  { name, description?, userId? }
// Planned access: customer only; the signed-in user becomes the owner.
export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  if (body === undefined) {
    return jsonError(400, "Invalid JSON body");
  }

  const input = validatePlaylistInput(body, { allowUserId: true });

  if ("error" in input) {
    return jsonError(400, input.error);
  }

  try {
    const playlist = await createPlaylist(input.value);

    return NextResponse.json(playlist, {
      status: 201,
      headers: { Location: `/api/playlists/${playlist.id}` },
    });
  } catch (error) {
    console.error("POST /api/playlists error:", error);
    return jsonError(500, "Failed to create playlist");
  }
}
