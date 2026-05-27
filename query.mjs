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
    const q = query(collection(db, "users"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        console.log(`Not found: ${name}`);
        return;
    }
    
    for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log(`User ID: ${doc.id}`);
        console.log(`Data:`, data);
        
        // Let's also check sessions for today
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const sq = query(collection(db, "sessions"), 
                         where("userUid", "==", doc.id),
                         where("status", "==", "finished"));
        const sqSnap = await getDocs(sq);
        let used = 0;
        sqSnap.forEach(s => {
            const sd = s.data();
            if (sd.createdAt && sd.createdAt.toDate && sd.createdAt.toDate() >= startOfToday) {
                used += (sd.vol || 0);
            } else if (sd.createdAt && sd.createdAt.seconds) {
                 if (sd.createdAt.seconds * 1000 >= startOfToday.getTime()) {
                     used += (sd.vol || 0);
                 }
            }
        });
        console.log(`Total used today (from sessions): ${used}`);
    }
    console.log("-----------------------");
}

async function run() {
    await checkUser("จงกล เนตรทิพย์");
    await checkUser("ธนพร เนตรทิพย์");
    await checkUser("สุปราณี สิงห์ชุมพร");
    process.exit(0);
}

run();
