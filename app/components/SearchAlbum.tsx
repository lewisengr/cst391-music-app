"use client";

import { useState } from "react";
import type { Album } from "@/lib/types";
import AlbumList from "./AlbumList";

export default function SearchAlbum({ albums }: { albums: Album[] }) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const results = albums.filter((album) =>
    [album.title, album.artist, album.description].some((field) =>
      (field ?? "").toLowerCase().includes(search),
    ),
  );

  return (
    <>
      <div className="mb-4">
        <label className="form-label" htmlFor="album-search">Search albums</label>
        <div className="input-group">
          <input
            id="album-search"
            type="search"
            className="form-control"
            placeholder="Title, artist, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn btn-outline-secondary" type="button" onClick={() => setQuery("")} disabled={!query}>
            Clear
          </button>
        </div>
      </div>
      <AlbumList albums={results} />
    </>
  );
}
