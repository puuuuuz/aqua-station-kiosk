import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";

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
const targetKioskId = "5cc58f943af49e79";
const targetUserUid = "U12836fec6f605312b5caab01c261c895";

console.log("🔥 STARTING REAL-TIME MONITOR FOR KIOSK:", targetKioskId);
console.log("Press Ctrl+C to stop.");
console.log("------------------------------------------------------------------");

// 1. Listen for new machine logs in real-time
const logsQuery = query(
    collection(db, "machine_logs"),
    where("machineId", "==", targetKioskId)
);

let initialLogsLoaded = false;
let knownLogIds = new Set();

onSnapshot(logsQuery, (snapshot) => {
    let newLogs = [];
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data();
            const id = change.doc.id;
            
            // Only capture new logs written AFTER we started the script
            if (!initialLogsLoaded) {
                knownLogIds.add(id);
            } else if (!knownLogIds.has(id)) {
                knownLogIds.add(id);
                newLogs.push({ id, ...data });
            }
        }
    });

    if (!initialLogsLoaded) {
        initialLogsLoaded = true;
        console.log("✅ Real-time Listener for machine_logs established.");
    }

    newLogs.sort((a, b) => (a.timestamp?.toDate?.() || 0) - (b.timestamp?.toDate?.() || 0));
    newLogs.forEach((log) => {
        const timeStr = log.timestamp?.toDate?.() ? log.timestamp.toDate().toLocaleTimeString('th-TH', {timeZone: 'Asia/Bangkok'}) : new Date().toLocaleTimeString();
        console.log(`\x1b[31m[LOG - ${timeStr}] [${log.status || log.level || 'INFO'}] ${log.details || log.message || ''}\x1b[0m`);
    });
});

// 2. Listen for session updates in real-time
const sessionsQuery = query(
    collection(db, "sessions"),
    where("kioskId", "==", targetKioskId)
);

let initialSessionsLoaded = false;
let sessionStates = {};

onSnapshot(sessionsQuery, (snapshot) => {
    let sessionChanges = [];
    snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;
        
        if (change.type === "added" || change.type === "modified") {
            if (!initialSessionsLoaded) {
                sessionStates[id] = JSON.stringify({ status: data.status, finalVol: data.finalVol, currentVol: data.currentVol });
            } else {
                const prevStateStr = sessionStates[id];
                const currState = { status: data.status, finalVol: data.finalVol, currentVol: data.currentVol };
                const currStateStr = JSON.stringify(currState);
                
                if (prevStateStr !== currStateStr) {
                    sessionStates[id] = currStateStr;
                    sessionChanges.push({ id, type: change.type, prev: prevStateStr ? JSON.parse(prevStateStr) : null, curr: currState, raw: data });
                }
            }
        }
    });

    if (!initialSessionsLoaded) {
        initialSessionsLoaded = true;
        console.log("✅ Real-time Listener for sessions established.");
        console.log("------------------------------------------------------------------");
    }

    sessionChanges.forEach((c) => {
        const timeStr = new Date().toLocaleTimeString('th-TH', {timeZone: 'Asia/Bangkok'});
        console.log(`\x1b[32m[SESSION - ${timeStr}] ID: ${c.id}\x1b[0m`);
        console.log(`    Status: \x1b[33m${c.prev?.status || 'N/A'}\x1b[0m -> \x1b[36m${c.curr.status}\x1b[0m`);
        console.log(`    Vol: target=${c.raw.selectedVol || c.raw.vol} | current=${c.curr.currentVol} | final=${c.curr.finalVol}`);
        if (c.raw.stopReason) {
            console.log(`    Stop Reason: \x1b[31m${c.raw.stopReason}\x1b[0m`);
        }
        if (c.raw.tdsIn !== undefined) {
            console.log(`    TDS: IN=${c.raw.tdsIn} | OUT=${c.raw.tdsOut}`);
        }
    });
});
