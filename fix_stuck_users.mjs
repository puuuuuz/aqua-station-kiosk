import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, getDocs, updateDoc, doc } from "firebase/firestore";

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
    const allUsersSnap = await getDocs(collection(db, "users"));
    
    for (const userDoc of allUsersSnap.docs) {
        const data = userDoc.data();
        const litersLeft = parseFloat(data.litersLeft || 0);
        const extraQuota = parseFloat(data.extraQuota || 0);
        
        if (extraQuota > 0 && litersLeft <= 0) {
            console.log(`Fixing stuck user ${data.displayName || data.name} (${data.phone})`);
            await updateDoc(doc(db, "users", userDoc.id), {
                litersLeft: extraQuota // Sync to extraQuota so old APK sees it
            });
            console.log(`- Updated litersLeft to ${extraQuota}`);
        }
    }
    
    process.exit(0);
}
run();
