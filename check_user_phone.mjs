import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

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
    const phoneToSearch = process.argv[2] || "0645516650";
    const q = query(collection(db, "users"), where("phone", "==", phoneToSearch));
    const snap = await getDocs(q);
    if (!snap.empty) {
        snap.forEach(doc => {
            console.log(`USER DOC ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
        });
    } else {
        console.log(`USER DOC with phone ${phoneToSearch} DOES NOT EXIST`);
    }
    process.exit(0);
}
run();
