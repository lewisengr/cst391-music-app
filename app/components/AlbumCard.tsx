import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/lib/types";

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const cover = album.image?.trim();
  const hasCover = cover && (/^https?:\/\/[^\s/]+/i.test(cover) || /^\/(?!\/)/.test(cover));

  return (
    <article className="card h-100 overflow-hidden shadow-sm">
      {hasCover && (
        <Image
          src={cover}
          alt={`${album.title} album cover`}
          className="card-img-top album-cover"
          width={320}
          height={320}
          unoptimized
        />
      )}
      <div className="card-body d-flex flex-column">
        <h2 className="h5 card-title">{album.title}</h2>
        <p className="text-body-secondary mb-2">{album.artist} · {album.year}</p>
        {album.description && <p className="card-text">{album.description}</p>}
        <div className="d-flex gap-2 mt-auto pt-2">
          <Link href={`/show/${album.id}`} className="btn btn-primary" aria-label={`View ${album.title}`}>View</Link>
          <Link href={`/edit/${album.id}`} className="btn btn-outline-secondary" aria-label={`Edit ${album.title}`}>Edit</Link>
        </div>
      </div>
    </article>
  );
}
