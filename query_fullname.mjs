import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUser(name) {
    console.log(`Checking user: ${name}`);
    
    // Check fullName
    let q = query(collection(db, "users"), where("fullName", "==", name));
    let querySnapshot = await getDocs(q);
    
    // If not found, try displayName
    if (querySnapshot.empty) {
        q = query(collection(db, "users"), where("displayName", "==", name));
        querySnapshot = await getDocs(q);
    }
    
    // If still not found, try searching parts
    if (querySnapshot.empty) {
        console.log(`Not found exact match for: ${name}. Try partial manually later.`);
        return;
    }
    
    for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log(`Found: ID = ${doc.id}`);
        console.log(`Quota = ${data.quota}, ExtraQuota = ${data.extraQuota}, TotalVol = ${data.totalVol}`);
        console.log(`lastQuotaResetDate = ${data.lastQuotaResetDate}`);
        
        // Let's also check sessions for today
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const sq = query(collection(db, "sessions"), 
                         where("userUid", "==", doc.id),
                         where("status", "==", "finished"));
        const sqSnap = await getDocs(sq);
        let usedToday = 0;
        let sessionCount = 0;
        sqSnap.forEach(s => {
            const sd = s.data();
            if (sd.createdAt && sd.createdAt.toDate && sd.createdAt.toDate() >= startOfToday) {
                usedToday += (sd.vol || 0);
                sessionCount++;
            } else if (sd.createdAt && sd.createdAt.seconds) {
                 if (sd.createdAt.seconds * 1000 >= startOfToday.getTime()) {
                     usedToday += (sd.vol || 0);
                     sessionCount++;
                 }
            }
        });
        console.log(`Used Today (from finished sessions): ${usedToday} Liters across ${sessionCount} sessions`);
    }
    console.log("-----------------------");
}

async function run() {
    await checkUser("จงกล เนตรทิพย์");
    await checkUser("ธนพร เนตรทิพย์");
    await checkUser("สุปราณี สิงห์ชุมพร");
    
    // also try adding prefixes if not found
    await checkUser("นาง จงกล เนตรทิพย์");
    await checkUser("น.ส. ธนพร เนตรทิพย์");
    await checkUser("นาง สุปราณี สิงห์ชุมพร");
    
    process.exit(0);
}

run();
