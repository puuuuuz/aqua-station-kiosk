import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
const firebaseConfig = { apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ", authDomain: "siam-circuit.firebaseapp.com", projectId: "siam-circuit", storageBucket: "siam-circuit.firebasestorage.app", messagingSenderId: "330527536801", appId: "1:330527536801:web:c0132854940609dd3f62e" };
const db = getFirestore(initializeApp(firebaseConfig));
async function run() {
    const ref = doc(db, "settings", "kiosk_config");
    await updateDoc(ref, {
        latest_apk_version: "",
        apk_url: ""
    });
    console.log("Cleared OTA fields to stop data waste.");
    process.exit(0);
}
run();
