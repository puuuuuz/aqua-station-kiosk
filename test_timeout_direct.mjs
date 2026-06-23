import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";

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
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Setting user quota to 2.0");
    await setDoc(doc(db, "users", "TEST_TIMEOUT"), {
        litersLeft: 2.0,
        extraQuota: 0,
        name: "Timeout Tester",
        lastQuotaResetDate: "6/10/2026"
    });

    console.log("Creating confirmed session...");
    await setDoc(doc(db, "sessions", "TEST_TIMEOUT_SESS"), {
        userUid: "TEST_TIMEOUT",
        status: "confirmed",
        kioskId: "T01"
    });

    await sleep(5000);
    console.log("Setting to timeout...");
    await updateDoc(doc(db, "sessions", "TEST_TIMEOUT_SESS"), {
        status: "timeout"
    });
    
    console.log("Waiting for CF...");
    await sleep(5000);
    console.log("Done. Please check DB for TEST_TIMEOUT.");
    process.exit(0);
}
run();
