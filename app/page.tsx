"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/apiClient";
import type { Album } from "@/lib/types";
import SearchAlbum from "./components/SearchAlbum";

const ALBUM_LIST_PATH = "/albums";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; albums: Album[] }
  | { status: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadAlbums() {
      try {
        const albums = await get<Album[]>(ALBUM_LIST_PATH, controller.signal);
        if (!Array.isArray(albums)) throw new Error("Unexpected album response.");
        if (!controller.signal.aborted) setState({ status: "loaded", albums });
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : "Please try again.";
          setState({ status: "error", message });
        }
      }
    }
    void loadAlbums();
    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="container py-4">
      <h1 className="mb-1">Music Albums</h1>
      <p className="text-body-secondary mb-4">Dylan Lewis - CST-391</p>
      {state.status === "loading" && <p role="status">Loading albums…</p>}
      {state.status === "error" && (
        <div className="alert alert-danger" role="alert">
          <p>Could not load albums. {state.message}</p>
          <button
            className="btn btn-outline-danger"
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          >
            Try Again
          </button>
        </div>
      )}
      {state.status === "loaded" && <SearchAlbum albums={state.albums} />}
    </main>
  );
}
