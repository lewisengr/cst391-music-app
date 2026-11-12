"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { get, post, put } from "@/lib/apiClient";
import type { Album, Track } from "@/lib/types";

interface EditAlbumProps {
  albumId?: string;
  readOnly?: boolean;
}

type TrackDraft = Omit<Track, "number"> & { number: string };
type AlbumDraft = {
  title: string;
  artist: string;
  description: string;
  year: string;
  image: string;
  tracks: TrackDraft[];
};

const emptyDraft: AlbumDraft = {
  title: "",
  artist: "",
  description: "",
  year: "",
  image: "",
  tracks: [],
};

const albumFields = [
  { name: "title", label: "Album Title" },
  { name: "artist", label: "Artist" },
  { name: "year", label: "Year" },
  { name: "description", label: "Description" },
  { name: "image", label: "Image URL" },
] as const;

const trackFields = [
  { name: "title", label: "Title" },
  { name: "number", label: "Number" },
  { name: "video", label: "Video URL" },
  { name: "lyrics", label: "Lyrics" },
] as const;

function toDraft(album: Album): AlbumDraft {
  return {
    title: album.title,
    artist: album.artist,
    description: album.description ?? "",
    year: String(album.year),
    image: album.image ?? "",
    tracks: (album.tracks ?? []).map((track) => ({
      ...track,
      number: String(track.number),
    })),
  };
}

export default function EditAlbum({ albumId, readOnly = false }: EditAlbumProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<AlbumDraft | null>(albumId ? null : emptyDraft);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!albumId) return;

    const controller = new AbortController();
    async function loadAlbum() {
      try {
        if (!albumId || !/^\d+$/.test(albumId)) throw new Error("Invalid album ID.");
        const albums = await get<Album[]>(
          `/albums?albumId=${encodeURIComponent(albumId)}`,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          if (albums[0]) setDraft(toDraft(albums[0]));
          else setLoadError("Album not found.");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load this album.");
        }
      }
    }
    void loadAlbum();
    return () => controller.abort();
  }, [albumId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || readOnly || saving) return;

    const album = {
      title: draft.title.trim(),
      artist: draft.artist.trim(),
      description: draft.description.trim() || null,
      year: Number(draft.year),
      image: draft.image.trim() || null,
      tracks: draft.tracks.map((track) => ({
        ...track,
        title: track.title.trim(),
        number: Number(track.number),
        video: track.video?.trim() || null,
      })),
    } satisfies Omit<Album, "id">;

    if (!album.title || !album.artist || !Number.isInteger(album.year) || album.year < 1 || album.year > 9999) {
      setSaveError("Enter a title, artist, and year between 1 and 9999.");
      return;
    }
    if (album.tracks.some((track) => !track.title || !Number.isSafeInteger(track.number) || track.number < 1)) {
      setSaveError("Each track needs a title and a positive whole track number.");
      return;
    }

    setSaveError("");
    setSaving(true);
    try {
      if (albumId) {
        // The existing PUT endpoint expects albumId in the request body.
        await put<{ message: string }>("/albums", { ...album, albumId: Number(albumId) });
      } else {
        await post<{ id: number }>("/albums", album);
      }
      router.push("/");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the album.");
      setSaving(false);
    }
  }

  return (
    <main className="container py-4">
      <div className="row">
        <div className="col-lg-8">
          <h1 className="mb-4">{readOnly ? "Album Details" : albumId ? "Edit Album" : "Create Album"}</h1>
          {loadError && <p className="alert alert-danger" role="alert">{loadError}</p>}
          {!draft && !loadError && <p role="status">Loading album…</p>}
          {draft && (
            <form onSubmit={save} aria-busy={saving}>
              {saveError && <p className="alert alert-danger" role="alert">{saveError}</p>}
              <fieldset disabled={saving}>
                {albumFields.map(({ name, label }) => {
                  const props = {
                    id: `album-${name}`,
                    className: "form-control",
                    value: draft[name],
                    readOnly,
                    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                      setDraft({ ...draft, [name]: event.target.value });
                    },
                  };
                  return (
                    <div className="mb-3" key={name}>
                      <label className="form-label" htmlFor={props.id}>{label}</label>
                      {name === "description" ? <textarea {...props} rows={3} /> : (
                        <input
                          {...props}
                          type={name === "year" ? "number" : "text"}
                          required={name === "title" || name === "artist" || name === "year"}
                          min={name === "year" ? 1 : undefined}
                          max={name === "year" ? 9999 : undefined}
                        />
                      )}
                    </div>
                  );
                })}
                {albumId && (
                  <section aria-labelledby="tracks-heading" className="my-4">
                    <h2 id="tracks-heading" className="h4">Tracks</h2>
                    {draft.tracks.length === 0 && <p>No tracks for this album.</p>}
                    {draft.tracks.map((track, index) => (
                      <fieldset key={track.id ?? index} className="border rounded p-3 mb-3">
                        <legend className="h6">Track {index + 1}</legend>
                        {trackFields.map(({ name, label }) => {
                          const props = {
                            id: `track-${index}-${name}`,
                            className: "form-control",
                            value: track[name] ?? "",
                            readOnly,
                            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                              const value = event.target.value;
                              setDraft({
                                ...draft,
                                tracks: draft.tracks.map((item, i) => i === index ? { ...item, [name]: value } : item),
                              });
                            },
                          };
                          return (
                            <div className="mb-2" key={name}>
                              <label className="form-label" htmlFor={props.id}>{label}</label>
                              {name === "lyrics" ? <textarea {...props} rows={3} /> : (
                                <input
                                  {...props}
                                  type={name === "number" ? "number" : "text"}
                                  min={name === "number" ? 1 : undefined}
                                  required={name === "title" || name === "number"}
                                />
                              )}
                            </div>
                          );
                        })}
                      </fieldset>
                    ))}
                  </section>
                )}
                {!readOnly && (
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {saving ? "Saving…" : albumId ? "Save Changes" : "Create Album"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => router.push("/")}>
                      Cancel
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          )}
          {(readOnly || loadError) && <Link href="/" className="btn btn-outline-secondary">Home</Link>}
        </div>
      </div>
    </main>
  );
}
