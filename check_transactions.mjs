import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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
const userUid = "U12836fec6f605312b5caab01c261c895";

async function run() {
    try {
        const q = query(
            collection(db, "transactions"), 
            where("userUid", "==", userUid)
        );
        const snap = await getDocs(q);
        let transactions = [];
        snap.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        
        transactions.sort((a, b) => {
            const ta = a.time?.toDate?.() || new Date(0);
            const tb = b.time?.toDate?.() || new Date(0);
            return tb - ta;
        });

        console.log(`Found ${transactions.length} transactions. Displaying top 5:`);
        transactions.slice(0, 5).forEach((t, idx) => {
            const time = t.time?.toDate?.() || null;
            console.log(`\n[${idx+1}] Transaction ID: ${t.id}`);
            console.log(`    Session ID: ${t.sessionId}`);
            console.log(`    Time: ${time ? time.toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A'}`);
            console.log(`    Vol: ${t.vol} L`);
            console.log(`    Method: ${t.method}`);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
