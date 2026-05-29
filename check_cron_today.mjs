import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
    console.log(`Checking Cron Quota for date: ${todayStr}`);

    const q = query(collection(db, "users"), where("status", "in", ["approved", "active"]));
    const snap = await getDocs(q);

    let totalUsers = snap.size;
    let resetToday = 0;
    let notReset = 0;
    
    let sampleNotReset = [];

    snap.forEach(doc => {
        const data = doc.data();
        if (data.lastQuotaResetDate === todayStr) {
            resetToday++;
        } else {
            notReset++;
            if (sampleNotReset.length < 5) {
                sampleNotReset.push(`${data.phone || doc.id} (last reset: ${data.lastQuotaResetDate || 'never'})`);
            }
        }
    });

    console.log(`=== สรุปการรัน Cron Quota ===`);
    console.log(`จำนวนผู้ใช้ที่ต้องรีเซ็ตโควต้า (approved/active): ${totalUsers} คน`);
    console.log(`✅ รีเซ็ตโควต้าของวันนี้แล้ว: ${resetToday} คน`);
    console.log(`❌ ยังไม่ถูกรีเซ็ตวันนี้: ${notReset} คน`);
    
    if (notReset > 0 && sampleNotReset.length > 0) {
        console.log(`\nตัวอย่างคนที่ยังไม่ได้รีเซ็ต:`);
        sampleNotReset.forEach(p => console.log(`- ${p}`));
    }
    
    // Also run summarize_today.mjs
    console.log('\n--- ยอดการใช้น้ำของวันนี้ ---');
    process.exit(0);
}
run();
