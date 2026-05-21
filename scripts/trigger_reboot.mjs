import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

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

async function triggerReboot() {
    try {
        const machineId = "5cc58f943af49e79";
        console.log(`Sending loop-free reboot command to machine ${machineId}...`);
        
        await setDoc(doc(db, "commands", machineId), {
            type: "reboot",
            value: true,
            timestamp: serverTimestamp()
        });
        
        console.log("✅ Loop-free reboot command sent successfully!");
    } catch (e) {
        console.error("ERROR:", e);
    }
}

triggerReboot();
