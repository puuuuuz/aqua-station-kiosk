import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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

async function readLogs() {
    console.log("Reading debug logs...");
    const logsRef = collection(db, "debug_logs");
    // Sort by a field if exists, but we didn't add timestamp.
    // So let's just get everything and take the last 50
    const querySnapshot = await getDocs(logsRef);
    const allLogs = [];
    querySnapshot.forEach((doc) => {
        allLogs.push(doc.data());
    });
    const lastLogs = allLogs.slice(-50);
    lastLogs.forEach(data => console.log(data));
    process.exit(0);
}

readLogs();
