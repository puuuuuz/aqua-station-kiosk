import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection } from "firebase/firestore";

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

async function generateReport() {
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        
        let totalUsers = usersSnap.size;
        let base2Liters = 0;
        let baseOther = 0;
        let hasExtraQuota = 0;
        let totalExtraVolume = 0;
        
        usersSnap.forEach(doc => {
            const u = doc.data();
            
            const quota = parseFloat(u.quota);
            if (!isNaN(quota)) {
                if (quota === 2.0) {
                    base2Liters++;
                } else {
                    baseOther++;
                }
            }
            
            const extra = parseFloat(u.extraQuota);
            if (!isNaN(extra) && extra > 0) {
                hasExtraQuota++;
                totalExtraVolume += extra;
            }
        });
        
        console.log("=== QUOTA REPORT ===");
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Users with Base 2.0L: ${base2Liters}`);
        console.log(`Users with other Base Quota: ${baseOther}`);
        console.log(`Users with Extra Quota (>0): ${hasExtraQuota}`);
        console.log(`Total Extra Quota Volume across all users: ${totalExtraVolume.toFixed(2)}L`);
        
    } catch (e) {
        console.error("Error generating report:", e);
    }
    process.exit(0);
}

generateReport();
