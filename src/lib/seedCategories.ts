import { db } from "../lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, getDocs, query } from "firebase/firestore";
import { EVENT_CATEGORY_HIERARCHY, normalizeCategoryKey } from "../constants/artistSystem";

export async function seedCategories() {
  const categoriesRef = collection(db, "categories");
  const existing = await getDocs(query(categoriesRef));

  if (!existing.empty) {
    console.log("Categories already exist, skipping seed.");
    return;
  }

  const batch = writeBatch(db);

  Object.entries(EVENT_CATEGORY_HIERARCHY).forEach(([eventName, eventData]) => {
    const eventId = normalizeCategoryKey(eventName);
    const eventDocRef = doc(db, "categories", eventId);

    // Level 1: Event Type / Main Category
    batch.set(eventDocRef, {
      id: eventId,
      name: eventName,
      slug: eventId,
      parentId: null,
      level: 1,
      icon: eventData.icon,
      image: `/categories/${eventId}.png`,
      isActive: true,
      createdAt: serverTimestamp()
    });

    Object.entries(eventData.groups).forEach(([groupName, groupData]) => {
      const groupId = `${eventId}__${normalizeCategoryKey(groupName)}`;
      const groupDocRef = doc(db, "categories", groupId);

      // Level 2: Category Group
      batch.set(groupDocRef, {
        id: groupId,
        name: groupName,
        slug: normalizeCategoryKey(groupName),
        parentId: eventId,
        level: 2,
        icon: groupData.icon,
        image: `/categories/${normalizeCategoryKey(groupName)}.png`,
        isActive: true,
        createdAt: serverTimestamp()
      });

      groupData.subcategories.forEach((subName) => {
        const subId = normalizeCategoryKey(subName);
        const subDocRef = doc(db, "categories", `${groupId}__${subId}`);

        // Level 3: Subcategory / Art Form
        batch.set(subDocRef, {
          id: `${groupId}__${subId}`,
          name: subName,
          slug: subId,
          parentId: groupId,
          eventTypeId: eventId,
          level: 3,
          icon: groupData.icon,
          image: `/categories/${subId}.png`,
          isActive: true,
          createdAt: serverTimestamp()
        });
      });
    });
  });

  await batch.commit();
  console.log("3-Level Categories seeded successfully!");
}
