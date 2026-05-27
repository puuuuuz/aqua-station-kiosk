import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

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
    const phoneToUpdate = "0939984495";
    const amountToAdd = 2;
    
    console.log(`Looking for user with phone: ${phoneToUpdate}`);
    const q = query(collection(db, "users"), where("phone", "==", phoneToUpdate));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        for (const userDoc of snap.docs) {
            const data = userDoc.data();
            console.log(`Found user ${userDoc.id}:`, data.displayName || data.name);
            
            const currentExtra = parseFloat(data.extraQuota || 0);
            const newExtra = currentExtra + amountToAdd;
            
            // For backward compatibility with old cache, also force litersLeft to 2 if it's 0
            const currentLitersLeft = parseFloat(data.litersLeft || 0);
            const newLitersLeft = currentLitersLeft <= 0 ? amountToAdd : currentLitersLeft;

            console.log(`Updating extraQuota: ${currentExtra} -> ${newExtra}`);
            console.log(`Updating litersLeft: ${currentLitersLeft} -> ${newLitersLeft}`);
            
            await updateDoc(doc(db, "users", userDoc.id), {
                extraQuota: newExtra,
                litersLeft: newLitersLeft
            });
            console.log("Update successful!");
        }
    } else {
        console.log(`USER DOC with phone ${phoneToUpdate} DOES NOT EXIST`);
    }
    process.exit(0);
}
run();
