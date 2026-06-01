import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit",
    storageBucket: "siam-circuit.firebasestorage.app",
    messagingSenderId: "330527536801",
    appId: "1:330527536801:web:c0132854940609dd3f62e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkLog() {
    const q = query(
        collection(db, "machine_logs"),
        where("machineId", "==", "5cc58f943af49e79")
    );
    const snap = await getDocs(q);
    let logs = [];
    snap.forEach(d => {
        logs.push(d.data());
    });
    logs.sort((a, b) => b.timestamp - a.timestamp);
    logs.slice(0, 15).forEach(l => {
        const time = l.timestamp ? l.timestamp.toDate().toLocaleString('th-TH') : 'Unknown';
        console.log(`[${time}] ${l.status}: ${l.details}`);
    });
    process.exit(0);
}

checkLog().catch(console.error);
