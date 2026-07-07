export {
  ARTIST_TYPES as ARTIST_CATEGORIES,
  ARTIST_TYPE_OPTIONS,
  CATEGORY_GROUP_ICONS,
  CATEGORY_GROUP_OPTIONS,
  CATEGORY_GROUPS,
  getArtistTypesForFilter as getCategoriesForFilter,
  getCategoryGroupForArtistType as getCategoryGroupForCategory,
  isCategoryGroup,
  normalizeArtistRecord,
  normalizeArtistType as normalizeArtistCategory,
  normalizeCategoryKey,
};

export type {
  ArtistType as ArtistCategory,
  CategoryGroupName,
};
