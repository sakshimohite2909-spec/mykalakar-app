import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CategoryGroup {
  heading: string;
  tags: string[];
}

const FALLBACK_CATEGORIES: CategoryGroup[] = [
  {
    heading: "Varkari Sampraday",
    tags: [
      "Kirtankar",
      "Pravachankar",
      "Vyaspithchalak",
      "Chopdar",
      "Bhagwat Katha Kathan",
      "Ram Katha",
      "Gayak",
      "Bharudkar",
      "Bhajani Mandal",
      "Shastriya Bhajan",
      "Mridangamani",
      "Vinekari",
      "Talkari",
      "Tabla Vadak",
      "Harmonium Vadak",
      "Dholki Vadak",
      "Chiplya Player",
      "Warkari Sanstha",
      "Sound System",
      "Mandap Decoration"
    ],
  },
  {
    heading: "Wedding",
    tags: [
      "Banquet Hall",
      "Marriage Hall",
      "Lawn",
      "Bridal Makeup Artist",
      "Groom Makeup Artist",
      "Mehendi Artist",
      "Wedding Photographer",
      "Candid Photographer",
      "Wedding Videographer",
      "Drone Photography",
      "Pre-Wedding Shoot",
      "DJ",
      "Live Singer",
      "Orchestra",
      "Wedding Band",
      "Anchor (Emcee)",
      "Dhol-Tasha Pathak",
      "Lezim Pathak",
      "Veg Catering",
      "Non-Veg Catering",
      "Buffet Service",
      "Maharashtrian Catering",
      "Wedding Decorator",
      "Flower Decoration",
      "Mandap Decoration",
      "Sound System",
      "Stage Setup",
      "Lighting",
      "Bridal Car",
      "Wedding Card Designer",
      "Pandit / Priest",
      "Wedding Planner"
    ],
  },
  {
    heading: "Performers",
    tags: [
      "Karaoke Singers",
      "Orchestra",
      "Magicians",
      "Puppet Show",
      "DJs",
      "Anchors / Hosts",
      "Motivational Speakers",
      "Actors",
      "Singers",
      "Live Bands"
    ],
  },
  {
    heading: "Event Services",
    tags: [
      "Photography",
      "Videography",
      "Makeup Artists",
      "Mehndi Artists",
      "Sound System",
      "Mandap Decoration"
    ],
  },
  {
    heading: "Folk & Traditional Arts",
    tags: [
      "Gondhal",
      "Jagran",
      "Bharud",
      "Shahiri & Powada",
      "Lezim Pathak",
      "Zanj Pathak",
      "Dhol Pathak",
      "Waghya Murali",
      "Jalsa & Dashavatar",
      "Dhagaai & Dholki",
      "Bahurupiya"
    ],
  }
];

export function useCategories() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        if (querySnapshot.empty) {
          // Fallback to hardcoded constants if database is empty
          setCategories(FALLBACK_CATEGORIES);
        } else {
          // Assuming Firestore 'categories' collection has docs where each doc represents a group
          // Or a single doc contains an array. Let's handle a standard collection of groups.
          const fetchedGroups: CategoryGroup[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Try to parse it as CategoryGroup
            if (data.heading && Array.isArray(data.tags)) {
              fetchedGroups.push({
                heading: data.heading,
                tags: data.tags,
              });
            } else if (data.groups && Array.isArray(data.groups)) {
               // In case it's stored in a single document under 'groups'
               fetchedGroups.push(...data.groups);
            }
          });

          if (fetchedGroups.length > 0) {
            setCategories(fetchedGroups);
          } else {
            setCategories(FALLBACK_CATEGORIES);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err as Error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
