import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, deleteField } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit",
    storageBucket: "siam-circuit.appspot.com",
    messagingSenderId: "367352824968",
    appId: "1:367352824968:web:1eb1a4db419c8f2ba1c79a",
    measurementId: "G-CP1G3W360T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function unlockUser() {
    try {
        const userId = "U71a4571b12b6df480625a284bbcb130c";
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            isDispensing: deleteField(),
            lockTime: deleteField(),
            lockedByMachine: deleteField(),
            preDeductedLiters: deleteField(),
            preDeductedExtra: deleteField(),
            litersLeft: 40 // Force restore to 40
        });
        console.log(`✅ Unlocked user ${userId} and restored litersLeft to 40`);
    } catch (e) {
        console.error("❌ Error unlocking:", e);
    }
    process.exit(0);
}

unlockUser();
