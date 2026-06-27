import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";

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

async function setCanary() {
    try {
        const machineId = process.argv[2] || "5cc58f943af49e79";
        const targetVersion = process.argv[3] || "2.0.7-build-1212";
        const targetUrl = process.argv[4] || "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/app-debug.apk";

        console.log(`🚀 Setting Canary OTA for machine ${machineId}...`);
        console.log(`🎯 Target Version: ${targetVersion}`);
        console.log(`📥 Target URL: ${targetUrl}`);

        const machineRef = doc(db, "machines", machineId);
        await setDoc(machineRef, {
            target_apk_version: targetVersion,
            target_apk_url: targetUrl
        }, { merge: true });
        
        console.log("✅ Firebase updated successfully! The machine should start downloading now.");
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR updating Firebase:", e);
        process.exit(1);
    }
}

setCanary();
