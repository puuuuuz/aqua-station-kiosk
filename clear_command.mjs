import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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
    console.log("🧹 Clearing remote reboot command for kiosk 5cc58f943af49e79...");
    await updateDoc(doc(db, "commands", "5cc58f943af49e79"), {
        type: null,
        value: null,
        timestamp: null
    });
    console.log("✅ Command cleared successfully!");
    process.exit(0);
}
run();
