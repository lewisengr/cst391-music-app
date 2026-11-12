import { Suspense } from "react";
import EditAlbum from "../../components/EditAlbum";

async function AlbumDetailsWithId({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const { albumId } = await params;
  return <EditAlbum key={albumId} albumId={albumId} readOnly />;
}

export default function AlbumDetailsPage({ params }: { params: Promise<{ albumId: string }> }) {
  return (
    <Suspense fallback={<p className="container py-4" role="status">Loading album…</p>}>
      <AlbumDetailsWithId params={params} />
    </Suspense>
  );
}
