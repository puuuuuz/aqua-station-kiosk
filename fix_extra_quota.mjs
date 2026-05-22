import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection, updateDoc, doc } from "firebase/firestore";

const app = initializeApp({
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit"
});
const db = getFirestore(app);

async function run() {
    console.log("Fixing accidental extraQuota...");
    const snap = await getDocs(collection(db, "users"));
    
    let count = 0;
    
    for (const d of snap.docs) {
        const u = d.data();
        const e = parseFloat(u.extraQuota);
        
        // If extra quota is exactly 2.0 (or smaller fraction like 0.62), it came from litersLeft.
        // We will reset it to 0.
        // Also if it's นพพล มานพ who got 100 extra, we reset it because his base quota is already 100.
        if (e > 0) {
            let shouldReset = false;
            
            if (e <= 2.0) {
                shouldReset = true;
            } else if (u.displayName === "นพพล มานพ" && e === 100) {
                shouldReset = true;
            }
            
            if (shouldReset) {
                await updateDoc(doc(db, "users", d.id), { extraQuota: 0 });
                count++;
            }
        }
    }
    
    console.log(`Reset extraQuota to 0 for ${count} users.`);
    process.exit(0);
}
run();
