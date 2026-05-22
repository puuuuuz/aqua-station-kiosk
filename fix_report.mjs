import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection } from "firebase/firestore";

const app = initializeApp({
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit"
});
const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, "users"));
    snap.forEach(d => {
        const u = d.data();
        const e = parseFloat(u.extraQuota);
        if (e > 0 && e !== 2) {
            console.log(u.displayName, "Quota:", u.quota, "Extra:", u.extraQuota);
        }
    });
    process.exit(0);
}
run();
