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
    console.log("Restoring quota for เพ็ญนภา สินโอฬาร...");
    await updateDoc(doc(db, "users", "Ud49180594b0f876fb5b80867503d1955"), {
        litersLeft: 2.0
    });
    console.log("Restored litersLeft to 2.0 successfully.");
    process.exit(0);
}
run();
