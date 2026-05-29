const fs = require('fs');
let code = fs.readFileSync('liff-app.html', 'utf8');

// 1. Replace Import
code = code.replace(
    'import { getFirestore, initializeFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";',
    'import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-lite.js";'
);

// 2. Fix initializeFirestore
code = code.replace(/const db = initializeFirestore\(app, \{[\s\S]*?\}\);/, 'const db = getFirestore(app);');

// 3. Fix onSnapshot to setInterval
const oldOnSnapshot = `                window._liffSessionUnsub = onSnapshot(sessionDocRef, (snap) => {
                    if (!snap.exists()) return;`;

const newOnSnapshot = `                window._liffSessionUnsub = function() { clearInterval(window._liffSessionUnsubTimer); };
                window._liffSessionUnsubTimer = setInterval(async () => {
                    const snap = await getDoc(sessionDocRef).catch(e => { console.warn("Poll err", e); return null; });
                    if (!snap || !snap.exists()) return;`;

if (code.includes(oldOnSnapshot)) {
    code = code.replace(oldOnSnapshot, newOnSnapshot);
    console.log("Patched onSnapshot start.");
} else {
    console.log("Could not find oldOnSnapshot");
}

// 4. Fix the end of onSnapshot
const oldOnSnapshotEnd = `                        lastObservedStatus = 'finished';
                    }
                });`;
const newOnSnapshotEnd = `                        lastObservedStatus = 'finished';
                    }
                }, 2000);`;

if (code.includes(oldOnSnapshotEnd)) {
    code = code.replace(oldOnSnapshotEnd, newOnSnapshotEnd);
    console.log("Patched onSnapshot end.");
} else {
    console.log("Could not find oldOnSnapshotEnd");
}

fs.writeFileSync('liff-app.html', code);
