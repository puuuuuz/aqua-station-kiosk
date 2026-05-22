import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
    const userUID = "U12836fec6f605312b5caab01c261c895";
    const snap = await getDoc(doc(db, "users", userUID));
    if (snap.exists()) {
        console.log(`USER DOC ${userUID}:`, JSON.stringify(snap.data(), null, 2));
    } else {
        console.log(`USER DOC ${userUID} DOES NOT EXIST`);
    }
    process.exit(0);
}
run();
