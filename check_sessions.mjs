import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

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

async function run() {
    const q1 = query(
        collection(db, "sessions"), 
        where("phone", "==", "0814947809")
    );
    
    const snap1 = await getDocs(q1);
    console.log("Sessions by phone (0814947809):");
    snap1.forEach(doc => {
        console.log(`- ${doc.id}: status=${doc.data().status}, vol=${doc.data().vol}, reqVol=${doc.data().reqVol}, time=${new Date(doc.data().timestamp?.toMillis()).toLocaleString()}`);
    });

    const q2 = query(
        collection(db, "sessions"), 
        where("userUid", "==", "Ud49180594b0f876fb5b80867503d1955")
    );
    
    const snap2 = await getDocs(q2);
    console.log("\\nSessions by userUid (Ud49...):");
    snap2.forEach(doc => {
        console.log(`- ${doc.id}: status=${doc.data().status}, vol=${doc.data().vol}, reqVol=${doc.data().reqVol}, time=${new Date(doc.data().timestamp?.toMillis()).toLocaleString()}`);
    });

    process.exit(0);
}
run();
