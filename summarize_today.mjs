import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    // Using a simpler query since sometimes index is missing
    const snap = await getDocs(collection(db, "sessions"));
    
    let totalLiters = 0;
    let sessionCount = 0;
    let users = new Set();
    let pendingSessions = 0;

    snap.forEach(d => {
        const data = d.data();
        let sessionTime = 0;
        if (data.createdAt && data.createdAt.toDate) {
            sessionTime = data.createdAt.toDate().getTime();
        } else if (data.createdAt && data.createdAt.seconds) {
            sessionTime = data.createdAt.seconds * 1000;
        }

        if (sessionTime >= startOfToday.getTime()) {
            if (data.status === 'finished') {
                totalLiters += parseFloat(data.vol || data.finalVol || data.selectedVol || 0);
                sessionCount++;
                if (data.userUid) users.add(data.userUid);
            } else {
                pendingSessions++;
            }
        }
    });

    console.log(`=== สรุปการกดน้ำวันนี้ ===`);
    console.log(`ยอดน้ำรวม (สำเร็จ): ${totalLiters.toFixed(2)} ลิตร`);
    console.log(`จำนวนครั้ง (สำเร็จ): ${sessionCount} ครั้ง`);
    console.log(`จำนวนผู้ใช้งาน (สำเร็จ): ${users.size} คน`);
    console.log(`รายการที่กดไม่สำเร็จ/ค้าง: ${pendingSessions} รายการ`);

    process.exit(0);
}
run();
