import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

    for (let u of matchedUsers) {
        console.log(`User: ${u.fullName}`);
        console.log(`litersLeft: ${u.litersLeft}`);
    }
    process.exit(0);
}
run();
