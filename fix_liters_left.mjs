import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, deleteField } from "firebase/firestore";

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

async function fixUser() {
    try {
        const users = [
            { phone: "0834563235", quota: 40 },
            { phone: "0965704158", quota: 2 }
        ];
        
        for (const u of users) {
            const q = query(collection(db, "users"), where("phone", "==", u.phone));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                console.log(`❌ User ${u.phone} not found!`);
                continue;
            }

            for (const docSnap of snapshot.docs) {
                console.log("Fixing user:", docSnap.id, u.phone);
                await updateDoc(docSnap.ref, {
                    litersLeft: deleteField(),
                    isDispensing: deleteField(),
                    lockTime: deleteField(),
                    lockedByMachine: deleteField(),
                    preDeductedLiters: deleteField(),
                    preDeductedExtra: deleteField(),
                    quota: u.quota
                });
                console.log(`✅ Cleared litersLeft and unlocked session for ${u.phone} with quota ${u.quota}`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixUser();
