export const CATEGORY_IMAGE_MAP: Record<string, string>;
export const DEFAULT_MAPPED_IMAGE: string;
export function getMappedImage(categoryName?: unknown, fallback?: string): string;
export function hasMappedImage(categoryName?: unknown): boolean;
