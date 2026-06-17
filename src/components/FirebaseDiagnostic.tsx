import { useEffect } from 'react';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase'; 

export const FirebaseDiagnostic = () => {
  useEffect(() => {
    const runDiagnostics = async () => {
      console.log("🔥 RUNNING FIREBASE DIAGNOSTIC...");
      try {
        // Test 1: Naked Events Query
        const events = await getDocs(query(collection(db, 'events'), limit(1)));
        console.log(`✅ EVENTS: Found ${events.size}. Data:`, events.docs[0]?.data());

        // Test 2: Naked Artists Query
        const artists = await getDocs(query(collection(db, 'artists'), limit(1)));
        console.log(`✅ ARTISTS (Unfiltered): Found ${artists.size}. Data:`, artists.docs[0]?.data());

        // Test 3: Filtered Artists Query (Testing Schema Reality)
        const activeArtists = await getDocs(query(collection(db, 'artists'), where('status', '==', 'active'), limit(1)));
        console.log(`✅ ARTISTS (Filtered 'active'): Found ${activeArtists.size}.`);
        
      } catch (error: any) {
        console.error("❌ FIREBASE DIAGNOSTIC FAILED:", error.code, error.message);
      }
    };
    runDiagnostics();
  }, []);
  
  return null; // Invisible component
};
