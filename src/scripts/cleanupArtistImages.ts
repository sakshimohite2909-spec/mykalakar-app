import { collection, doc, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { imageRegistry } from "@/services/ImageRegistryService";
import { getArtistServices } from "@/services/marketplaceCards";

type ArtistDoc = Record<string, any> & { id: string };

function imagePool() {
  return imageRegistry.getCatalogImages("artists");
}

function uniqueImagesForArtist(artist: ArtistDoc, used: Set<string>) {
  const services = getArtistServices(artist);
  const count = Math.max(3, services.length || 1);
  const pool = imagePool();
  const selected: string[] = [];

  for (let index = 0; index < pool.length && selected.length < count; index += 1) {
    const candidate = pool[(index + artist.id.length) % pool.length];
    if (!candidate || used.has(candidate) || selected.includes(candidate)) continue;
    selected.push(candidate);
    used.add(candidate);
  }

  return selected;
}

function collectArtistImages(artist: ArtistDoc) {
  return [
    artist.profileImage?.url,
    artist.profileImage?.thumbnail,
    artist.coverImage?.url,
    artist.coverImage?.thumbnail,
    artist.media?.profilePhoto,
    artist.media?.coverPhoto,
    artist.profilePhoto,
    artist.coverPhoto,
    ...(Array.isArray(artist.gallery) ? artist.gallery.map((item: any) => item?.url || item?.thumbnail || item) : []),
    ...(Array.isArray(artist.media?.galleryPhotos) ? artist.media.galleryPhotos : []),
    ...(Array.isArray(artist.galleryPhotos) ? artist.galleryPhotos : []),
  ].filter(Boolean) as string[];
}

export async function cleanupArtistImages({ dryRun = true, pageSize = 500 } = {}) {
  const snap = await getDocs(query(collection(db, "artists"), limit(pageSize)));
  const artists = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as ArtistDoc[];
  const urlOwners = new Map<string, string[]>();

  artists.forEach((artist) => {
    collectArtistImages(artist).forEach((url) => {
      urlOwners.set(url, [...(urlOwners.get(url) || []), artist.id]);
    });
  });

  const duplicates = [...urlOwners.entries()].filter(([, owners]) => owners.length > 1);
  const used = new Set([...urlOwners.keys()]);
  const batch = writeBatch(db);
  const updates: Array<{ artistId: string; replacementImages: string[] }> = [];
  const alreadyUpdated = new Set<string>();

  duplicates.forEach(([, owners]) => {
    owners.slice(1).forEach((artistId) => {
      if (alreadyUpdated.has(artistId)) return;
      const artist = artists.find((item) => item.id === artistId);
      if (!artist) return;
      const replacementImages = uniqueImagesForArtist(artist, used);
      if (!replacementImages.length) return;
      updates.push({ artistId, replacementImages });
      alreadyUpdated.add(artistId);

      if (!dryRun) {
        batch.set(
          doc(db, "artists", artistId),
          {
            profileImage: {
              url: replacementImages[0],
              thumbnail: replacementImages[0],
            },
            coverImage: {
              url: replacementImages[1] || replacementImages[0],
              thumbnail: replacementImages[1] || replacementImages[0],
            },
            gallery: replacementImages.map((url, index) => ({ url, thumbnail: url, sortOrder: index })),
            media: {
              ...(artist.media || {}),
              profilePhoto: replacementImages[0],
              coverPhoto: replacementImages[1] || replacementImages[0],
              galleryPhotos: replacementImages,
            },
            profilePhoto: replacementImages[0],
            coverPhoto: replacementImages[1] || replacementImages[0],
            galleryPhotos: replacementImages,
            mediaDedupeStatus: "cleaned",
            mediaDedupeUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });
  });

  if (!dryRun && updates.length > 0) {
    await batch.commit();
  }

  return {
    scannedArtists: artists.length,
    duplicateUrls: duplicates.length,
    updatedArtists: updates.length,
    dryRun,
    updates,
  };
}

if (typeof window !== "undefined") {
  (window as any).cleanupArtistImages = cleanupArtistImages;
}
