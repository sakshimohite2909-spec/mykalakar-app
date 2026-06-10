import { describe, expect, it } from "vitest";
import {
  buildEventFilterGroups,
  filterArtists,
  filterEvents,
  getActiveCategories,
  getParentCategoryForSubCategory,
  syncSmartFilters,
} from "./filterEngine";

describe("smart filter engine", () => {
  it("auto-selects a parent category when a subcategory is selected", () => {
    expect(getParentCategoryForSubCategory("Bharud")).toBe("Folk & Traditional Arts");
    expect(syncSmartFilters({ subCategory: "Bharud" }).category).toBe("Folk & Traditional Arts");
  });

  it("resets an invalid subcategory when the category changes", () => {
    const filters = syncSmartFilters(
      { category: "Performers" },
      { query: "", category: "Folk & Traditional Arts", subCategory: "Bharud" },
    );

    expect(filters.category).toBe("Performers");
    expect(filters.subCategory).toBeNull();
  });

  it("applies strict category and subcategory filtering", () => {
    const artists = [
      { id: "1", name: "Asha", category: "Folk & Traditional Arts", subcategory: "Bharud" },
      { id: "2", name: "Ravi", category: "Performers", subcategory: "Singers" },
    ];

    expect(filterArtists(artists, { query: "", category: "Folk & Traditional Arts", subCategory: "Bharud" })).toHaveLength(1);
    expect(filterArtists(artists, { query: "", category: "Performers", subCategory: "Bharud" })).toHaveLength(0);
  });

  it("supports legacy music/singer data without changing Firebase records", () => {
    const artists = [{ id: "1", name: "Meera", category: "Music", subCategory: "Singer" }];

    expect(syncSmartFilters({ subCategory: "Singer" })).toMatchObject({ query: "", category: "Performers", subCategory: "Singers" });
    expect(filterArtists(artists, { query: "", category: "Performers", subCategory: "Singers" })).toHaveLength(1);
  });

  it("filters Firebase event briefs by required category arrays", () => {
    const events = [
      { id: "1", title: "Festival", requiredCategories: ["Dhol Pathak", "Lezim Pathak"] },
      { id: "2", title: "Wedding", requiredCategories: ["Photography"] },
    ];

    expect(filterEvents(events, { query: "", category: "Folk & Traditional Arts", subCategory: null })).toHaveLength(1);
    expect(filterEvents(events, { query: "", category: "Folk & Traditional Arts", subCategory: "Dhol Pathak" })).toHaveLength(1);
    expect(filterEvents(events, { query: "", category: "Performers", subCategory: "Dhol Pathak" })).toHaveLength(0);
  });

  it("builds event category facets from live event records", () => {
    const events = [
      { id: "1", title: "Festival", requiredCategories: ["Dhol Pathak", "Lezim Pathak"] },
      { id: "2", title: "Wedding", requiredCategories: ["Photography"] },
      { id: "3", title: "Wedding 2", requiredCategories: ["Photography"] },
    ];

    const groups = buildEventFilterGroups(events).map(({ icon, ...group }) => group);

    expect(groups).toEqual([
      {
        id: "event-services",
        name: "Event Services",
        count: 2,
        subcategories: [{ name: "Photography", count: 2 }],
      },
      {
        id: "folk-and-traditional-arts",
        name: "Folk & Traditional Arts",
        count: 2,
        subcategories: [
          { name: "Dhol Pathak", count: 1 },
          { name: "Lezim Pathak", count: 1 },
        ],
      },
    ]);
  });

  it("supports multi-layer parent category, subcategory, tags, and event types", () => {
    const filters = syncSmartFilters({
      categories: ["Performers", "Folk & Traditional Arts"],
      subCategories: ["Singers"],
      tags: ["wedding"],
      eventTypes: ["festival"],
    });
    const artists = [
      {
        id: "1",
        name: "Asha",
        category: "Singers",
        tags: ["wedding vocals"],
        eventTypes: ["Festival"],
      },
      {
        id: "2",
        name: "Ravi",
        category: "Dhol Pathak",
        tags: ["festival"],
        eventTypes: ["Festival"],
      },
    ];

    expect(getActiveCategories(filters)).toContain("Performers");
    expect(filterArtists(artists, filters)).toHaveLength(1);
  });
});
