import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const q = query(collection(db, "users"), limit(5));
    const snap = await getDocs(q);
    snap.forEach(doc => {
        console.log(doc.id, doc.data());
    });
    process.exit(0);
}
run();
