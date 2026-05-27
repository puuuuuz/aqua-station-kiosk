import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
const firebaseConfig = { apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ", authDomain: "siam-circuit.firebaseapp.com", projectId: "siam-circuit", storageBucket: "siam-circuit.firebasestorage.app", messagingSenderId: "330527536801", appId: "1:330527536801:web:c0132854940609dd3f62e" };
const db = getFirestore(initializeApp(firebaseConfig));
async function run() {
    const q2 = query(collection(db, "sessions"), where("userUid", "==", "Ud49180594b0f876fb5b80867503d1955"));
    const snap2 = await getDocs(q2);
    let sessions = [];
    snap2.forEach(doc => { sessions.push({id: doc.id, data: doc.data()}); });
    sessions.sort((a, b) => b.data.confirmedAt?.seconds - a.data.confirmedAt?.seconds);
    sessions.slice(0, 5).forEach(s => console.log(s.id, s.data.status, s.data.vol, s.data.confirmedAt));
    process.exit(0);
}
run();
