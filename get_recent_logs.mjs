import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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

async function run() {
    const machineId = "5cc58f943af49e79";
    console.log(`Fetching last 200 logs to filter for ${machineId}...`);
    const q = query(
        collection(db, "machine_logs"), 
        orderBy("timestamp", "desc"),
        limit(200)
    );
    const snap = await getDocs(q);
    
    let logs = [];
    snap.forEach(doc => {
        const d = doc.data();
        if (d.machineId === machineId) {
            logs.push(d);
        }
    });

    console.log(`Found ${logs.length} logs for ${machineId} (in top 200 logs):`);
    logs.slice(0, 20).forEach((d, idx) => {
        const t = d.timestamp ? d.timestamp.toDate().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A';
        console.log(`[${idx+1}] [${t}] [${d.status}] ${d.details || d.message || ''}`);
    });
    process.exit(0);
}
run();
