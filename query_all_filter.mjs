import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const targets = ["จงกล", "ธนพร", "สุปราณี"];
    const snap = await getDocs(collection(db, "users"));
    
    let matchedUsers = [];
    snap.forEach(doc => {
        const data = doc.data();
        const fn = data.fullName || "";
        const dn = data.displayName || "";
        
        for (let target of targets) {
            if (fn.includes(target) || dn.includes(target)) {
                matchedUsers.push({ id: doc.id, ...data });
                break;
            }
        }
    });

    console.log(`Found ${matchedUsers.length} matched users.`);
    for (let u of matchedUsers) {
        console.log(`User: ${u.fullName} (ID: ${u.id})`);
        console.log(`- Quota: ${u.quota}, Extra: ${u.extraQuota}, TotalVol: ${u.totalVol}, LastReset: ${u.lastQuotaResetDate}`);
        
        // Fetch sessions for today
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const sq = query(collection(db, "sessions"), 
                         where("userUid", "==", u.id),
                         where("status", "==", "finished"));
        const sqSnap = await getDocs(sq);
        
        let usedToday = 0;
        let c = 0;
        sqSnap.forEach(s => {
            const sd = s.data();
            if (sd.createdAt && sd.createdAt.toDate && sd.createdAt.toDate() >= startOfToday) {
                usedToday += (sd.vol || 0);
                c++;
            } else if (sd.createdAt && sd.createdAt.seconds) {
                 if (sd.createdAt.seconds * 1000 >= startOfToday.getTime()) {
                     usedToday += (sd.vol || 0);
                     c++;
                 }
            }
        });
        console.log(`- Used Today: ${usedToday.toFixed(3)} L (${c} sessions)`);
        console.log("-----------------------");
    }
    process.exit(0);
}
run();
