import { db } from "../lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, getDocs, query } from "firebase/firestore";
import { CATEGORY_STRUCTURE, normalizeCategoryKey } from "../constants/artistSystem";

export async function seedCategories() {
  const categoriesRef = collection(db, "categories");
  const existing = await getDocs(query(categoriesRef));
  
  if (!existing.empty) {
    console.log("Categories already exist, skipping seed.");
    return;
  }

  const batch = writeBatch(db);

  Object.entries(CATEGORY_STRUCTURE).forEach(([mainName, data], index) => {
    const mainId = normalizeCategoryKey(mainName);
    const mainDocRef = doc(db, "categories", mainId);
    
    batch.set(mainDocRef, {
      id: mainId,
      name: mainName,
      slug: mainId,
      parentId: null,
      level: 1,
      icon: data.icon,
      image: `/categories/${mainId}.png`,
      isActive: true,
      createdAt: serverTimestamp()
    });

    data.subcategories.forEach((subName) => {
      const subId = normalizeCategoryKey(subName);
      const subDocRef = doc(db, "categories", subId);
      
      batch.set(subDocRef, {
        id: subId,
        name: subName,
        slug: subId,
        parentId: mainId,
        level: 2,
        icon: data.icon, // Inherit icon for now
        image: `/categories/${subId}.png`,
        isActive: true,
        createdAt: serverTimestamp()
      });
    });
  });

  await batch.commit();
  console.log("Categories seeded successfully!");
}
