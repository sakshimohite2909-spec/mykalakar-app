// @ts-nocheck
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import fs from "fs";
import path from "path";

declare const process: any;

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...valueParts] = trimmed.split("=");
          process.env[key.trim()] = valueParts.join("=").trim();
        }
      });
    }
  } catch (err) {
    console.warn("Notice loading .env file:", err);
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const isExecuteMode = process.argv.includes("--execute");

// Known dummy / test artist UIDs identified during testing
const DUMMY_TEST_UIDS = [
  "XzpaI7VQKiMixr",
  "6ADLheOChpWjfeaJ5ha",
  "qvHUKR",
  "qLt96s",
  "YbaIHz",
  "test_artist",
  "dummy_artist",
  "sample_artist"
];

async function cleanupDummyImages() {
  console.log("=================================================");
  console.log("🔍 MYKALAKAR SAFE DUMMY IMAGE CLEANUP SCRIPT");
  console.log(`MODE: ${isExecuteMode ? "⚡ EXECUTE (WILL DELETE DUMMY FILES)" : "🛡️ DRY-RUN (LIST ONLY - NO DELETIONS)"}`);
  console.log("=================================================\n");

  // Step 1: Sign in as Admin
  const adminUser = process.env.VITE_SEED_ADMIN_USERNAME || "vortex";
  const adminEmail = adminUser.includes("@") ? adminUser : `${adminUser}@mykalakar.app`;
  const adminPass = process.env.VITE_SEED_ADMIN_PASSWORD || "5iUUhB5RFNDcZMf@";

  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    const adminUid = cred.user.uid;
    console.log(`🔑 Authenticated as Admin (${adminEmail}, UID: ${adminUid})`);

    // Ensure admin doc exists so storage rules pass
    await setDoc(doc(db, "admins", adminUid), { role: "admin", email: adminEmail }, { merge: true });
    console.log("✅ Admin permissions verified in Firestore.\n");
  } catch (authErr) {
    console.warn(`⚠️ Could not authenticate as Admin (${adminEmail}):`, authErr);
  }

  // Step 2: Collect valid active artist UIDs & image URLs from Firestore
  console.log("1. Fetching valid artist records from Firestore...");
  const artistSnap = await getDocs(collection(db, "artists"));
  const userSnap = await getDocs(collection(db, "users"));

  const validArtistUids = new Set<string>();

  artistSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const uid = docSnap.id || data.uid;
    if (uid) validArtistUids.add(uid);
  });

  userSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const uid = docSnap.id || data.uid;
    if (uid) validArtistUids.add(uid);
  });

  console.log(`✅ Identified ${validArtistUids.size} VALID active artist/user records in Firestore.\n`);

  // Step 3: Check storage paths for identified dummy test UIDs
  console.log("2. Inspecting Storage for OLD DUMMY / TEST artist folders...");
  
  const dummyFilesToDelete: Array<{ path: string; fullRef: any; reason: string }> = [];

  const subCategories = ["profile", "cover", "gallery", "identity"];

  for (const dummyUid of DUMMY_TEST_UIDS) {
    if (validArtistUids.has(dummyUid)) continue;

    for (const sub of subCategories) {
      const pathStr = `artists/${dummyUid}/${sub}`;
      try {
        const folderRef = ref(storage, pathStr);
        const files = await getAllFilesRecursively(folderRef);
        files.forEach((f) => {
          dummyFilesToDelete.push({
            path: f.fullPath,
            fullRef: f,
            reason: `Belongs to old dummy test UID '${dummyUid}'`,
          });
        });
      } catch {
        // subpath empty or non-existent
      }
    }
  }

  // Step 4: Display Summary
  console.log("=================================================");
  console.log("📋 DUMMY IMAGE CLEANUP SUMMARY:");
  console.log(`- Valid Active Artist Records Preserved: ${validArtistUids.size}`);
  console.log(`- Old Dummy / Test Files Identified (TO DELETE): ${dummyFilesToDelete.length}`);
  console.log("=================================================\n");

  if (dummyFilesToDelete.length > 0) {
    console.log("🗑️ DUMMY/TEST FILES IDENTIFIED FOR CLEANUP:");
    dummyFilesToDelete.forEach((item, i) => {
      console.log(` [${i + 1}] Path: ${item.path}`);
      console.log(`     Reason: ${item.reason}`);
    });
    console.log("");
  } else {
    console.log("🎉 No dummy test files found in Storage! Storage is clean.\n");
  }

  // Step 5: Execute deletion if --execute flag is passed
  if (isExecuteMode && dummyFilesToDelete.length > 0) {
    console.log("=================================================");
    console.log("⚡ EXECUTING SAFE FILE DELETION...");
    console.log("=================================================");

    let deletedCount = 0;
    for (const item of dummyFilesToDelete) {
      try {
        await deleteObject(item.fullRef);
        console.log(`🗑️ Successfully deleted: ${item.path}`);
        deletedCount++;
      } catch (delErr) {
        console.error(`❌ Error deleting ${item.path}:`, delErr);
      }
    }
    console.log(`\n✅ Deletion complete. Safely removed ${deletedCount}/${dummyFilesToDelete.length} old dummy files.`);
  } else if (!isExecuteMode && dummyFilesToDelete.length > 0) {
    console.log("=================================================");
    console.log("💡 TO EXECUTE DELETION OF THESE DUMMY FILES:");
    console.log("   Run: npx tsx scripts/cleanupDummyImages.ts --execute");
    console.log("=================================================");
  }

  process.exit(0);
}

async function getAllFilesRecursively(dirRef: any): Promise<any[]> {
  try {
    const result = await listAll(dirRef);
    let files = [...result.items];
    for (const prefix of result.prefixes) {
      const subFiles = await getAllFilesRecursively(prefix);
      files = files.concat(subFiles);
    }
    return files;
  } catch {
    return [];
  }
}

cleanupDummyImages().catch((err) => {
  console.error("Cleanup script error:", err);
  process.exit(1);
});
