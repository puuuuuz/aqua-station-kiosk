import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Read service account
const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateUsers() {
    try {
        console.log("🔍 Looking for 'เทศบาลด่านสำโรง' area...");
        const areaSnapshot = await db.collection('areas').get();
        let targetAreaId = null;
        let targetAreaName = null;

        areaSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.includes('ด่านสำโรง')) {
                targetAreaId = doc.id;
                targetAreaName = data.name;
            }
        });

        if (!targetAreaId) {
            console.error("❌ Could not find area matching 'ด่านสำโรง'. Here are the available areas:");
            areaSnapshot.forEach(doc => {
                console.log(`- ${doc.id}: ${doc.data().name}`);
            });
            return;
        }

        console.log(`✅ Found target area: ${targetAreaName} (ID: ${targetAreaId})`);

        console.log("🔍 Fetching all users...");
        const usersSnapshot = await db.collection('users').get();
        
        let batch = db.batch();
        let updateCount = 0;
        let adminCount = 0;
        let alreadyCount = 0;
        let batchCount = 0;
        
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            
            // Skip admins
            if (userData.role === 'super_admin' || userData.role === 'local_admin') {
                adminCount++;
                continue;
            }
            
            // Optional: Skip if already assigned? The user said "user ทั้งหมดตอนนี้ให้เป็นของ เทศบาลด่านสำโรงก่อน"
            // Let's just update everyone who is a normal user.
            if (userData.areaId === targetAreaId) {
                alreadyCount++;
                continue;
            }
            
            batch.update(doc.ref, { areaId: targetAreaId });
            updateCount++;
            
            // Firestore batch limit is 500
            if (updateCount % 450 === 0) {
                await batch.commit();
                console.log(`⏳ Committed batch of 450 updates...`);
                batch = db.batch(); // Create a new batch
                batchCount++;
            }
        }

        if (updateCount > 0 && updateCount % 450 !== 0) {
            await batch.commit();
        }

        console.log(`🎉 Migration complete!`);
        console.log(`📊 Summary:`);
        console.log(`- Users updated: ${updateCount}`);
        console.log(`- Already in area: ${alreadyCount}`);
        console.log(`- Admins skipped: ${adminCount}`);
        
    } catch (e) {
        console.error("❌ Error migrating users:", e);
    }
}

migrateUsers();
