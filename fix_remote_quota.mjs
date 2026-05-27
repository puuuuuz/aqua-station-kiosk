import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const targets = ["จงกล", "ธนพร", "สุปราณี", "อำนาจ"];
    const snap = await getDocs(collection(db, "users"));
    
    let matchedUsers = [];
    snap.forEach(d => {
        const data = d.data();
        const fn = data.fullName || "";
        const dn = data.displayName || "";
        for (let target of targets) {
            if (fn.includes(target) || dn.includes(target)) {
                matchedUsers.push({ id: d.id, ...data });
                break;
            }
        }
    });

    const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });

    for (let u of matchedUsers) {
        if (u.litersLeft === 0) {
            console.log(`Fixing user: ${u.fullName} (ID: ${u.id})`);
            await updateDoc(doc(db, "users", u.id), {
                litersLeft: parseFloat(u.quota ?? 2.0),
                lastQuotaResetDate: todayStr
            });
            console.log(`✅ Set litersLeft to ${u.quota ?? 2.0} and lastQuotaResetDate to ${todayStr}`);
        }
    }
    console.log("Done fixing remote DB.");
    process.exit(0);
}
run();
