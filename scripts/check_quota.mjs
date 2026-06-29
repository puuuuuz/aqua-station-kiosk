import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit",
    storageBucket: "siam-circuit.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPhone(phone) {
    console.log("Checking:", phone);
    const q = query(collection(db, "users"), where("phone", "==", phone));
    const snap = await getDocs(q);
    if (snap.empty) {
        console.log("Not found.");
        return;
    }
    const userDoc = snap.docs[0];
    const data = userDoc.data();
    console.log("User Data:", {
        id: userDoc.id,
        status: data.status,
        litersLeft: data.litersLeft,
        quota: data.quota,
        totalQuota: data.totalQuota,
        daily_limit: data.daily_limit,
        limit_per_day: data.limit_per_day,
        limitPerDay: data.limitPerDay
    });

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const qUsage = query(collection(db, "sessions"), where("userUid", "==", userDoc.id), where("status", "==", "finished"));
    const usageSnap = await getDocs(qUsage);
    let actualUsedToday = 0;
    usageSnap.forEach(d => {
        const u = d.data();
        const fTime = u.finishedAt ? u.finishedAt.toDate() : (u.startedAt ? u.startedAt.toDate() : new Date());
        if (fTime >= startOfToday) {
            actualUsedToday += parseFloat(u.finalVol || u.selectedVol || u.vol || 0);
            console.log("Usage today:", d.id, u.finalVol || u.selectedVol || u.vol);
        }
    });
    console.log("Total used today:", actualUsedToday);
}

async function run() {
    await checkPhone("0645516650");
    console.log("---");
    await checkPhone("0834563235");
    process.exit(0);
}

run();
