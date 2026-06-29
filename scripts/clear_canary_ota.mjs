import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, deleteField } from "firebase/firestore";

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

async function clearCanary() {
    try {
        const machineId = "5cc58f943af49e79";
        console.log(`🛑 Clearing Canary OTA for machine ${machineId} to stop the loop...`);

        const machineRef = doc(db, "machines", machineId);
        await updateDoc(machineRef, {
            target_apk_version: deleteField(),
            target_apk_url: deleteField(),
            force_apk_update: deleteField(),
            ota_target_version: deleteField(),
            ota_apk_url: deleteField(),
            ota_force_update: deleteField()
        });
        
        console.log("✅ Firebase cleared! The infinite loop should stop.");
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR updating Firebase:", e);
        process.exit(1);
    }
}

clearCanary();
