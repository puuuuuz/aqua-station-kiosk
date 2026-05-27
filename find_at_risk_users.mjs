import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, "users"));
    
    const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
    let atRiskUsers = [];

    snap.forEach(d => {
        const data = d.data();
        
        // The condition for the bug to trigger:
        // 1. litersLeft is exactly 0 (or close to 0)
        // 2. lastQuotaResetDate is NOT today
        // 3. Status is approved/active (so they expect to use it)
        
        const isApproved = (data.status === 'approved' || data.status === 'active');
        const isZeroQuota = (data.litersLeft !== undefined && data.litersLeft <= 0);
        const notResetToday = (data.lastQuotaResetDate !== todayStr);
        
        if (isApproved && isZeroQuota && notResetToday) {
            atRiskUsers.push({ id: d.id, ...data });
        }
    });

    console.log(`Found ${atRiskUsers.length} users at risk of the QR Code Quota Bug.`);
    for (let u of atRiskUsers) {
        console.log(`- ${u.fullName || u.displayName} (Phone: ${u.phone}) | Quota: ${u.litersLeft}L | Last Reset: ${u.lastQuotaResetDate}`);
    }
    
    process.exit(0);
}
run();
