import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function forceOta() {
    try {
        const machineId = process.argv[2] || "VM:ทดสอบ";
        const targetVersion = process.argv[3] || "2.0.15";
        const targetUrl = process.argv[4] || "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/app-debug.apk?v=2015-force";

        console.log(`\n🚀 FORCE OTA for machine ${machineId}...`);
        console.log(`🎯 Target Version: ${targetVersion}`);
        console.log(`📥 Target URL: ${targetUrl}\n`);

        const cleanId = machineId.trim().toLowerCase();
        const commandRef = doc(db, "commands", cleanId);
        
        await setDoc(commandRef, {
            type: "force_ota",
            version: targetVersion,
            url: targetUrl,
            timestamp: Date.now()
        }, { merge: true });

        console.log("✅ Force OTA command sent successfully!");
        console.log("👉 Check the tablet screen for progress.");
        process.exit(0);

    } catch (e) {
        console.error("❌ ERROR sending command:", e);
        process.exit(1);
    }
}

forceOta();
