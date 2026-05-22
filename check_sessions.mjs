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
    const ids = ["5cc58f943af49e79-P-AATM", "5cc58f943af49e79-P-Q4R9", "5cc58f943af49e79-P-DEC3", "5cc58f943af49e79-P-U8I6"];
    for (const id of ids) {
        const snap = await getDoc(doc(db, "sessions", id));
        if (snap.exists()) {
            console.log(`SESSION DOC ${id}:`, JSON.stringify(snap.data(), null, 2));
        } else {
            console.log(`SESSION DOC ${id} DOES NOT EXIST`);
        }
    }
    process.exit(0);
}
run();
