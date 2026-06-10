import { describe, expect, it } from "vitest";
import { filterArtistCards, type ArtistCardViewModel } from "./marketplaceCards";

function card(overrides: Partial<ArtistCardViewModel>): ArtistCardViewModel {
  return {
    cardId: "card",
    artistId: "artist",
    uid: "artist",
    serviceId: "service",
    name: "Artist",
    category: "Music",
    subCategory: "Singer",
    priceRange: "On request",
    image: "",
    location: "Pune, Maharashtra",
    rating: 0,
    reviews: 0,
    verified: false,
    featured: false,
    bio: "",
    tags: [],
    eventTypes: [],
    artist: {},
    ...overrides,
  } as ArtistCardViewModel;
}

describe("marketplace card filters", () => {
  it("matches legacy category and subcategory aliases against canonical filters", () => {
    const cards = [card({ category: "Music", subCategory: "Singer" })];

    expect(filterArtistCards(cards, { query: "", category: "Performers", subCategory: "Singers" })).toHaveLength(1);
  });
});
