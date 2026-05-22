import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

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
const machineId = "5cc58f943af49e79";

async function run() {
    try {
        console.log(`Fetching last 15 logs specifically for machine ${machineId}...`);
        const q = query(
            collection(db, "machine_logs"),
            where("machineId", "==", machineId)
        );
        const snap = await getDocs(q);
        let logs = [];
        snap.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        
        logs.sort((a, b) => {
            const ta = a.timestamp?.toDate?.() || new Date(0);
            const tb = b.timestamp?.toDate?.() || new Date(0);
            return tb - ta;
        });

        console.log(`Found ${logs.length} logs for ${machineId}. Top 15 latest:`);
        logs.slice(0, 15).forEach((d, idx) => {
            const t = d.timestamp?.toDate?.() ? d.timestamp.toDate().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A';
            console.log(`[${idx+1}] [${t}] [${d.status || d.level}] ${d.details || d.message || d.msg || ''}`);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
