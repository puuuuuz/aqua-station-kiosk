import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
const firebaseConfig = { apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ", authDomain: "siam-circuit.firebaseapp.com", projectId: "siam-circuit", storageBucket: "siam-circuit.firebasestorage.app", messagingSenderId: "330527536801", appId: "1:330527536801:web:c0132854940609dd3f62e" };
const db = getFirestore(initializeApp(firebaseConfig));
async function run() {
    const snap = await getDoc(doc(db, "settings", "quota_config"));
    console.log(snap.data());
    process.exit(0);
}
run();
