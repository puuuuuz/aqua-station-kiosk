import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";

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
    const q1 = query(collection(db, "users"), where("displayName", "==", "เพ็ญนภา สินโอฬาร"));
    const q2 = query(collection(db, "users"), where("fullName", "==", "เพ็ญนภา สินโอฬาร"));
    const q3 = query(collection(db, "users"), where("name", "==", "เพ็ญนภา สินโอฬาร"));
    
    let targetUser = null;
    
    for (const q of [q1, q2, q3]) {
        const snap = await getDocs(q);
        if (!snap.empty) {
            targetUser = snap.docs[0].data();
            console.log(`Found target user (${snap.docs[0].id}):`, JSON.stringify(targetUser, null, 2));
            break;
        }
    }
    
    if (!targetUser) {
        console.log("Could not find user exactly by name. Fetching all to regex match...");
        const allSnap = await getDocs(collection(db, "users"));
        for (const doc of allSnap.docs) {
            const data = doc.data();
            const name = data.displayName || data.fullName || data.name || "";
            if (name.includes("เพ็ญนภา")) {
                targetUser = data;
                console.log(`Found target user via includes (${doc.id}):`, JSON.stringify(targetUser, null, 2));
                break;
            }
        }
    }
    
    // Now let's analyze how many people have a similar issue.
    // Assuming the issue is: litersLeft is 0, but extraQuota > 0.
    // Or maybe extraQuota is added but litersLeft is 0.
    
    console.log("\\n--- Analyzing all users ---");
    const allUsersSnap = await getDocs(collection(db, "users"));
    let stuckUsers = [];
    
    allUsersSnap.forEach(doc => {
        const data = doc.data();
        const litersLeft = parseFloat(data.litersLeft || 0);
        const extraQuota = parseFloat(data.extraQuota || 0);
        
        // A user is "stuck" on the old APK if they have extraQuota > 0, but litersLeft <= 0, 
        // because the old APK caches litersLeft = 0 and won't let them dispense, 
        // unless they use QR code.
        if (extraQuota > 0 && litersLeft <= 0) {
            stuckUsers.push({
                name: data.displayName || data.fullName || data.name || "Unknown",
                phone: data.phone || "No Phone",
                litersLeft: data.litersLeft,
                extraQuota: data.extraQuota,
                status: data.status
            });
        }
    });
    
    console.log(`Total stuck users (litersLeft=0 but extraQuota>0): ${stuckUsers.length}`);
    if (stuckUsers.length < 20) {
        console.log("Stuck Users:", JSON.stringify(stuckUsers, null, 2));
    } else {
        console.log("Stuck Users sample:", JSON.stringify(stuckUsers.slice(0, 10), null, 2));
    }
    
    process.exit(0);
}
run();
