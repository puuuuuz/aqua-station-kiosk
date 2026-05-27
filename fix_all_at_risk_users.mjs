import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, "users"));
    const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
    let fixedCount = 0;

    for (let d of snap.docs) {
        const data = d.data();
        const isApproved = (data.status === 'approved' || data.status === 'active');
        const isZeroQuota = (data.litersLeft !== undefined && data.litersLeft <= 0);
        const notResetToday = (data.lastQuotaResetDate !== todayStr);
        
        if (isApproved && isZeroQuota && notResetToday) {
            await updateDoc(doc(db, "users", d.id), {
                litersLeft: parseFloat(data.quota ?? 2.0),
                lastQuotaResetDate: todayStr
            });
            fixedCount++;
            console.log(`✅ Fixed: ${data.fullName || data.displayName} (${data.phone}) -> Reset to ${data.quota ?? 2.0}L`);
        }
    }

    console.log(`Successfully fixed ${fixedCount} users in the database.`);
    process.exit(0);
}
run();
