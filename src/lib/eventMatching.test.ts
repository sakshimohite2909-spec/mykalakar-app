import { describe, expect, it } from "vitest";
import { artistMatchesEvent, getEventArtForms, getEventArtType } from "./eventMatching";

describe("eventMatching", () => {
  describe("getEventArtForms", () => {
    it("should return art forms from categories array", () => {
      const event = {
        categories: ["Singers", "DJs"],
      };
      expect(getEventArtForms(event)).toEqual(["Singers", "DJs"]);
    });

    it("should return art forms from individual properties if categories is absent", () => {
      const event = {
        artType: "Photography",
        subCategory: "Videography",
      };
      expect(getEventArtForms(event)).toEqual(["Photography", "Videography"]);
    });

    it("should fallback to performanceType if no other art forms are present", () => {
      const event = {
        performanceType: "solo" as any,
      };
      expect(getEventArtForms(event)).toEqual(["solo"]);
    });

    it("should ignore performanceType if other art forms are present", () => {
      const event = {
        categories: ["Singers"],
        performanceType: "solo" as any,
      };
      expect(getEventArtForms(event)).toEqual(["Singers"]);
    });
  });

  describe("getEventArtType", () => {
    it("should return first art form", () => {
      const event = {
        categories: ["Singers", "DJs"],
      };
      expect(getEventArtType(event)).toBe("Singers");
    });
  });

  describe("artistMatchesEvent", () => {
    it("should return false if status is not APPROVED", () => {
      const event = {
        status: "PENDING",
        categories: ["Singers"],
      };
      const artist = {
        artistProfile: {
          artForms: ["Singers"],
        },
      };
      expect(artistMatchesEvent(event, artist)).toBe(false);
    });

    it("should return true if artist matches one of the event categories", () => {
      const event = {
        status: "APPROVED",
        categories: ["Singers", "DJs"],
      };
      const artist = {
        artistProfile: {
          artForms: ["DJs"],
        },
      };
      expect(artistMatchesEvent(event, artist)).toBe(true);
    });

    it("should return false if artist has no matching art forms", () => {
      const event = {
        status: "APPROVED",
        categories: ["Singers"],
      };
      const artist = {
        artistProfile: {
          artForms: ["Photography"],
        },
      };
      expect(artistMatchesEvent(event, artist)).toBe(false);
    });

    it("should return true if artist subcategory matches event parent category group", () => {
      const event = {
        status: "APPROVED",
        categories: ["Performers"],
      };
      const artist = {
        artistProfile: {
          artForms: ["Singers"],
        },
      };
      expect(artistMatchesEvent(event, artist)).toBe(true);
    });

    it("should return true if artist parent category group matches event subcategory", () => {
      const event = {
        status: "APPROVED",
        categories: ["Singers"],
      };
      const artist = {
        artistProfile: {
          artForms: ["Performers"],
        },
      };
      expect(artistMatchesEvent(event, artist)).toBe(true);
    });

    it("should return true if artist subcategory and event subcategory are under the same category group", () => {
      const event = {
        status: "APPROVED",
        categories: ["Singers"],
      };
      const artist = {
        artistProfile: {
          artForms: ["Karaoke Singers"],
        },
      };
      expect(artistMatchesEvent(event, artist)).toBe(true);
    });
  });
});
