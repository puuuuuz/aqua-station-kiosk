import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase
const serviceAccount = JSON.parse(fs.readFileSync('./scd-smart-water-dispenser-firebase-adminsdk-30o6j-7be1a80c9e.json', 'utf8'));
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function check() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('dailyQuotaUsed', '>', 0).limit(5).get();
  
  if (snapshot.empty) {
    console.log("ALL USERS HAVE 0 QUOTA USED! It seems a reset DID happen recently.");
  } else {
    console.log(`FOUND ${snapshot.size} users with quota used > 0:`);
    snapshot.forEach(doc => {
      console.log(`User ${doc.id}: ${doc.data().dailyQuotaUsed} L used`);
    });
  }
}
check().catch(console.error);
