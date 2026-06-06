import { describe, expect, it } from "vitest";
import {
  buildEventRequirementGroups,
  filterArtistCardsByLocation,
  filterArtistCardsForEvent,
} from "./eventArtistFiltering";
import type { ArtistCardViewModel } from "./marketplaceCards";

function card(overrides: Partial<ArtistCardViewModel>): ArtistCardViewModel {
  return {
    cardId: "card",
    artistId: "artist",
    uid: "artist",
    serviceId: "service",
    name: "Artist",
    category: "Performers",
    subCategory: "Singers",
    priceRange: "On request",
    image: "",
    location: "Pune, Maharashtra",
    rating: 5,
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

describe("event artist filtering", () => {
  it("filters artists by selected event and selected location before building groups", () => {
    const cards = [
      card({
        cardId: "asha-1",
        artistId: "asha",
        category: "Performers",
        subCategory: "Singers",
        eventTypes: ["Wedding"],
        artist: { district: "Pune", state: "Maharashtra", eventTypes: ["Wedding"] },
      }),
      card({
        cardId: "asha-2",
        artistId: "asha",
        category: "Performers",
        subCategory: "Singers",
        eventTypes: ["Wedding"],
        artist: { district: "Pune", state: "Maharashtra", eventTypes: ["Wedding"] },
      }),
      card({
        cardId: "photo-1",
        artistId: "photo",
        category: "Event Services",
        subCategory: "Photography",
        location: "Mumbai, Maharashtra",
        eventTypes: ["Wedding"],
        artist: { district: "Mumbai", state: "Maharashtra", eventTypes: ["Wedding"] },
      }),
      card({
        cardId: "dhol-1",
        artistId: "dhol",
        category: "Folk & Traditional Arts",
        subCategory: "Dhol Pathak",
        eventTypes: ["Festival"],
        artist: { district: "Pune", state: "Maharashtra", eventTypes: ["Festival"] },
      }),
    ];

    const eventMatches = filterArtistCardsForEvent(cards, "1");
    const locationMatches = filterArtistCardsByLocation(eventMatches, "Maharashtra", "Pune");
    const groups = buildEventRequirementGroups(locationMatches, [{ name: "Performers", icon: "stage" }]);

    expect(groups).toEqual([
      {
        id: "performers",
        name: "Performers",
        icon: "stage",
        count: 1,
        subcategories: [{ name: "Singers", count: 1 }],
      },
    ]);
  });

  it("matches event aliases without leaking unrelated event artists", () => {
    const cards = [
      card({ cardId: "corporate", artistId: "corporate", eventTypes: ["Corporate"] }),
      card({ cardId: "birthday", artistId: "birthday", eventTypes: ["Birthday"] }),
      card({ cardId: "festival", artistId: "festival", eventTypes: ["Festival"] }),
      card({ cardId: "all", artistId: "all", eventTypes: ["All Events"] }),
    ];

    expect(filterArtistCardsForEvent(cards, "3").map((item) => item.artistId)).toEqual(["corporate", "all"]);
    expect(filterArtistCardsForEvent(cards, "2").map((item) => item.artistId)).toEqual(["birthday", "all"]);
  });
});
