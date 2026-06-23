import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

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

async function clearLogs() {
    console.log("Clearing logs...");
    const snap = await getDocs(collection(db, "debug_logs"));
    for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
    }
    console.log("Logs cleared!");
    process.exit(0);
}
clearLogs();
