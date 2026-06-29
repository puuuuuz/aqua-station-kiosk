import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function startStream() {
    const machineId = process.argv[2] || "5cc58f943af49e79";
    const cleanId = machineId.trim();
    
    console.log(`\n📡 Requesting console stream from machine ${cleanId}...`);
    
    // 1. Send command to start stream
    await setDoc(doc(db, "commands", cleanId), {
        type: "console_stream",
        value: true,
        timestamp: Date.now()
    });

    console.log("✅ Command sent! Waiting for logs...\n");
    console.log("--------------------------------------------------");

    // 2. Listen to the stream
    let lastLogLength = 0;
    const unsub = onSnapshot(doc(db, "console_streams", cleanId), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.logs && data.logs.length > lastLogLength) {
            const newLogs = data.logs.slice(lastLogLength);
            newLogs.forEach(log => console.log(log));
            lastLogLength = data.logs.length;
        }
    });

    // Run for 2 minutes
    setTimeout(() => {
        console.log("\n--------------------------------------------------");
        console.log("🛑 Stopping stream...");
        setDoc(doc(db, "commands", cleanId), {
            type: "console_stream",
            value: false,
            timestamp: Date.now()
        });
        unsub();
        process.exit(0);
    }, 120 * 1000);
}

startStream();
