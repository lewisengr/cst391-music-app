export interface Track {
  id?: number;
  album_id?: number;
  number: number;
  title: string;
  lyrics?: string | null;
  video?: string | null;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  image?: string | null;
  description?: string | null;
  tracks?: Track[];
}

export interface PlaylistTrack {
  trackId: number;
  position: number;
  title: string;
  number: number;
  albumId: number;
  albumTitle: string;
  artist: string;
  addedAt: string;
}

export interface Playlist {
  id: number;
  userId: number | null;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  trackCount?: number;
  tracks?: PlaylistTrack[];
}
