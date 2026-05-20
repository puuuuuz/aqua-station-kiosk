import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function updateWebVersion() {
    try {
        const version = process.argv[2] || "20260520_2150";
        console.log(`Updating web_version to: ${version}...`);
        
        await setDoc(doc(db, "settings", "kiosk_config"), {
            web_version: version
        }, { merge: true });
        
        console.log("🎉 Firestore web_version updated successfully!");
    } catch (e) {
        console.error("ERROR updating web_version:", e);
    }
}

updateWebVersion();
