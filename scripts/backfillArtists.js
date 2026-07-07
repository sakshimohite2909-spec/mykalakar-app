const admin = require("firebase-admin");

// Instructions for execution:
// 1. Download your service account key from the Firebase Console:
//    Project Settings > Service Accounts > Generate New Private Key
// 2. Save the downloaded JSON file as `serviceAccountKey.json` in the scripts directory.
// 3. Ensure you have the firebase-admin package installed: `npm install firebase-admin`
// 4. Run the script: `node scripts/backfillArtists.js`

// Initialize Firebase Admin (Update the path to your actual service account key)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backfillLegacyArtists() {
  console.log("Starting backfill for legacy artists...");
  const artistsRef = db.collection("artists");
  
  try {
    // We fetch all artists to ensure none are missed, but you could also query
    // for those missing the status field or emailVerified field specifically.
    const snapshot = await artistsRef.get();
    
    if (snapshot.empty) {
      console.log("No artists found in the database.");
      return;
    }

    let updatedCount = 0;
    const batchArray = [];
    let currentBatch = db.batch();
    let operationCounter = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};

      // Check if status is missing or not 'active'
      if (data.status !== "active") {
        updates.status = "active";
        needsUpdate = true;
      }

      // Check if emailVerified is missing or not true
      if (data.emailVerified !== true) {
        updates.emailVerified = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        currentBatch.update(doc.ref, updates);
        updatedCount++;
        operationCounter++;

        // Firestore batches support a maximum of 500 operations
        if (operationCounter === 500) {
          batchArray.push(currentBatch);
          currentBatch = db.batch();
          operationCounter = 0;
        }
      }
    });

    if (operationCounter > 0) {
      batchArray.push(currentBatch);
    }

    console.log(`Found ${updatedCount} artists requiring backfill.`);

    if (updatedCount > 0) {
      console.log(`Committing ${batchArray.length} batch(es)...`);
      for (const batch of batchArray) {
        await batch.commit();
      }
      console.log("Backfill completed successfully. All legacy artists have been updated.");
    } else {
      console.log("No updates were necessary.");
    }

  } catch (error) {
    console.error("Error running backfill script:", error);
  }
}

backfillLegacyArtists().then(() => process.exit(0));
