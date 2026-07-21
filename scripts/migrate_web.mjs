import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";

// The config is usually available in the project, I will use a dummy config or fetch it.
// Actually, since I have the service-account.json, I know the project ID is "siam-circuit".
const firebaseConfig = {
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    try {
        console.log("🔍 Looking for 'เทศบาลด่านสำโรง' area...");
        const areaSnapshot = await getDocs(collection(db, 'areas'));
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
            console.error("❌ Could not find area matching 'ด่านสำโรง'.");
            process.exit(1);
        }

        console.log(`✅ Found target area: ${targetAreaName} (ID: ${targetAreaId})`);
        console.log("🔍 Fetching all users...");
        
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let updateCount = 0;
        let alreadyCount = 0;
        let adminCount = 0;
        
        let batch = writeBatch(db);

        usersSnapshot.forEach(docSnap => {
            const userData = docSnap.data();
            
            if (userData.role === 'super_admin' || userData.role === 'local_admin') {
                adminCount++;
                return;
            }
            
            if (userData.areaId === targetAreaId) {
                alreadyCount++;
                return;
            }
            
            batch.update(doc(db, 'users', docSnap.id), { areaId: targetAreaId });
            updateCount++;
            
            if (updateCount % 450 === 0) {
                batch.commit();
                console.log(`⏳ Committed batch...`);
                batch = writeBatch(db);
            }
        });

        if (updateCount % 450 !== 0) {
            await batch.commit();
        }

        console.log(`🎉 Migration complete!`);
        console.log(`📊 Summary:`);
        console.log(`- Users updated: ${updateCount}`);
        console.log(`- Already in area: ${alreadyCount}`);
        console.log(`- Admins skipped: ${adminCount}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
