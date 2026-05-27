import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const ids = ["U561bd3406c585a0540011a91743507cc", "Uc9003f6d8d399080a17e06f03ef44f2b", "Udbacf538d4fc393091fa48b74f364552"];
    for (let id of ids) {
        const snap = await getDoc(doc(db, "users", id));
        const data = snap.data();
        console.log(`User: ${data.fullName}`);
        console.log(`litersLeft: ${data.litersLeft} (type: ${typeof data.litersLeft})`);
        console.log(`lastQuotaResetDate: ${data.lastQuotaResetDate} (type: ${typeof data.lastQuotaResetDate})`);
        console.log(`extraQuota: ${data.extraQuota} (type: ${typeof data.extraQuota})`);
    }
    process.exit(0);
}
run();
