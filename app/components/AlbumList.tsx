import type { Album } from "@/lib/types";
import AlbumCard from "./AlbumCard";

export default function AlbumList({ albums }: { albums: Album[] }) {
  if (albums.length === 0) return <p role="status">No albums found.</p>;

  return (
    <ul className="list-unstyled row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
      {albums.map((album) => (
        <li className="col" key={album.id}><AlbumCard album={album} /></li>
      ))}
    </ul>
  );
}
