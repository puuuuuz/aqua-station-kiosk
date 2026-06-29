import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore/lite";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const logsRef = collection(db, "logs", "5cc58f943af49e79", "entries");
    const q = query(logsRef, orderBy("timestamp", "desc"), limit(10));
    try {
        const snap = await getDocs(q);
        snap.forEach(doc => {
            const data = doc.data();
            console.log(new Date(data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp).toISOString(), data.message);
        });
    } catch(e) {
        console.error("Error", e);
    }
    process.exit(0);
}
run();
