import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

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

function drawProgressBar(pct, width = 30) {
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${pct}%`;
}

async function setCanary() {
    try {
        const machineId = process.argv[2] || "5cc58f943af49e79";
        const targetVersion = process.argv[3] || "2.0.7-build-1212";
        const targetUrl = process.argv[4] || "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/app-debug.apk";

        console.log(`\n🚀 Setting Canary OTA for machine ${machineId}...`);
        console.log(`🎯 Target Version: ${targetVersion}`);
        console.log(`📥 Target URL: ${targetUrl}\n`);

        const machineRef = doc(db, "machines", machineId);
        await setDoc(machineRef, {
            ota_target_version: targetVersion,
            ota_apk_url: targetUrl,
            ota_force_update: true,
            ota_progress: 0,
            ota_status: "pending"
        }, { merge: true });

        console.log("✅ Firebase updated successfully! Waiting for machine to start downloading...\n");

        // 📊 Subscribe to machine doc for live progress
        let lastStatus = "";
        const unsubscribe = onSnapshot(machineRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            const status = data.ota_status || "pending";
            const progress = data.ota_progress ?? 0;

            // Clear previous line and redraw
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);

            if (status === "downloading") {
                process.stdout.write(`📥 Downloading... ${drawProgressBar(progress)}`);
            } else if (status === "done") {
                console.log(`\n✅ Download complete! Installing...`);
            } else if (status === "installing") {
                console.log(`\n🔧 Installing APK...`);
            } else if (status === "failed") {
                console.log(`\n❌ Download failed!`);
                unsubscribe();
                process.exit(1);
            } else if (status === "idle" && lastStatus === "downloading") {
                console.log(`\n✅ OTA Complete! Machine should be restarting with ${targetVersion}...`);
                unsubscribe();
                process.exit(0);
            } else {
                process.stdout.write(`⏳ Status: ${status}`);
            }
            lastStatus = status;
        });

        // Auto-exit after 10 minutes if no completion
        setTimeout(() => {
            console.log("\n⏰ Timeout: OTA monitoring ended after 10 minutes.");
            unsubscribe();
            process.exit(0);
        }, 10 * 60 * 1000);

    } catch (e) {
        console.error("❌ ERROR updating Firebase:", e);
        process.exit(1);
    }
}

setCanary();
