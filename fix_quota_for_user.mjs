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
    const userUID = "U12836fec6f605312b5caab01c261c895";
    try {
        const userRef = doc(db, "users", userUID);
        await updateDoc(userRef, {
            litersLeft: 2
        });
        console.log(`✅ SUCCESSFULLY RESTORED litersLeft to 2 for user ${userUID}`);
    } catch (e) {
        console.error("❌ Failed to restore:", e);
    }
    process.exit(0);
}
run();
