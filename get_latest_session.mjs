import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

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
const userUid = "U12836fec6f605312b5caab01c261c895";

async function run() {
    try {
        console.log(`Checking latest sessions for user: ${userUid}`);
        const q = query(
            collection(db, "sessions"), 
            where("userUid", "==", userUid)
        );
        const snap = await getDocs(q);
        let sessions = [];
        snap.forEach(doc => {
            sessions.push({ id: doc.id, ...doc.data() });
        });
        
        sessions.sort((a, b) => {
            const ta = a.createdAt?.toDate?.() || a.startedAt?.toDate?.() || new Date(0);
            const tb = b.createdAt?.toDate?.() || b.startedAt?.toDate?.() || new Date(0);
            return tb - ta;
        });

        console.log(`Found ${sessions.length} sessions. Displaying top 5:`);
        sessions.slice(0, 5).forEach((s, idx) => {
            const created = s.createdAt?.toDate?.() || s.startedAt?.toDate?.() || null;
            console.log(`\n[${idx+1}] Session ID: ${s.id}`);
            console.log(`    Status: ${s.status}`);
            console.log(`    Created: ${created ? created.toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A'}`);
            console.log(`    TargetVol: ${s.targetVol} | CurrentVol: ${s.currentVol}`);
            console.log(`    LastActive: ${s.lastActiveTime?.toDate?.() ? s.lastActiveTime.toDate().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A'}`);
            if (s.dispensingStoppedAt) {
                console.log(`    StoppedAt: ${s.dispensingStoppedAt?.toDate?.() ? s.dispensingStoppedAt.toDate().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A'}`);
            }
            if (s.endedAt) {
                console.log(`    EndedAt: ${s.endedAt?.toDate?.() ? s.endedAt.toDate().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A'}`);
            }
            if (s.stopReason) {
                console.log(`    Stop Reason: ${s.stopReason}`);
            }
            if (s.logs && s.logs.length > 0) {
                console.log(`    Logs:`);
                s.logs.forEach(l => {
                    const lt = l.time?.toDate?.() || (l.time ? new Date(l.time) : null);
                    console.log(`      - [${lt ? lt.toLocaleTimeString('th-TH', {timeZone: 'Asia/Bangkok'}) : 'N/A'}] [${l.level || 'INFO'}] ${l.msg || l.message}`);
                });
            }
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
