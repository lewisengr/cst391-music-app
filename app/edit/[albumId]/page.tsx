import { Suspense } from "react";
import EditAlbum from "../../components/EditAlbum";

async function EditAlbumWithId({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const { albumId } = await params;
  return <EditAlbum key={albumId} albumId={albumId} />;
}

export default function EditAlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  return (
    <Suspense fallback={<p className="container py-4" role="status">Loading album…</p>}>
      <EditAlbumWithId params={params} />
    </Suspense>
  );
}
