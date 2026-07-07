import { CURATED_IMAGE_POOL } from "@/data/curatedImages";

export type ImagePoolItem = {
  id: string;
  url: string;
  category: "singer" | "dj" | "mandal" | "event" | "general";
  orientation: "landscape" | "portrait";
  used: false;
  tags?: string[];
};

export const IMAGE_POOL: ImagePoolItem[] = CURATED_IMAGE_POOL.map((image) => ({
  ...image,
  used: false,
}));
