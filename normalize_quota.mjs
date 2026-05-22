import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocs, collection, updateDoc, deleteField, getDoc } from "firebase/firestore";

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
    try {
        console.log("Fetching quota config...");
        let inAreaVol = 2.0;
        let outAreaVol = 2.0;
        let inAreaProvinces = [];
        let inAreaDistricts = [];
        let inAreaSubdistricts = [];

        const quotaSnap = await getDoc(doc(db, "settings", "quota_config"));
        if (quotaSnap.exists()) {
            const qc = quotaSnap.data();
            inAreaVol = qc.inAreaVol || 2.0;
            outAreaVol = qc.outAreaVol || 2.0;
            inAreaProvinces = qc.inAreaProvinces || [];
            inAreaDistricts = qc.inAreaDistricts || [];
            inAreaSubdistricts = qc.inAreaSubdistricts || [];
        }

        console.log(`Base In-Area: ${inAreaVol}L, Base Out-Area: ${outAreaVol}L`);

        console.log("Fetching users...");
        const usersSnap = await getDocs(collection(db, "users"));
        
        let normalizedCount = 0;
        
        for (const userDoc of usersSnap.docs) {
            const u = userDoc.data();
            const updates = {};
            let needsUpdate = false;

            // Calculate Base Quota if undefined
            let baseQuota = parseFloat(u.quota);
            if (isNaN(baseQuota)) {
                if (inAreaProvinces.includes(u.province) || inAreaDistricts.includes(u.district) || inAreaSubdistricts.includes(u.subdistrict)) {
                    baseQuota = inAreaVol;
                } else {
                    baseQuota = outAreaVol;
                }
                updates.quota = baseQuota;
                needsUpdate = true;
            }

            // Calculate extraQuota, absorbing old fields
            let newExtra = parseFloat(u.extraQuota) || 0;
            let absorbed = false;

            if (u.litersLeft !== undefined) {
                const litersLeft = parseFloat(u.litersLeft) || 0;
                if (litersLeft > 0) newExtra += litersLeft;
                updates.litersLeft = deleteField();
                needsUpdate = true;
                absorbed = true;
            }

            if (u.customQuota !== undefined) {
                const customQ = parseFloat(u.customQuota) || 0;
                if (customQ > baseQuota) newExtra += (customQ - baseQuota);
                updates.customQuota = deleteField();
                needsUpdate = true;
                absorbed = true;
            }

            if (absorbed || u.extraQuota === undefined) {
                updates.extraQuota = newExtra;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await updateDoc(doc(db, "users", userDoc.id), updates);
                normalizedCount++;
                console.log(`Normalized ${u.displayName || userDoc.id}: quota=${baseQuota}, extraQuota=${newExtra}`);
            }
        }

        console.log(`\n🎉 Normalization Complete! Updated ${normalizedCount} users.`);
    } catch (e) {
        console.error("Error normalizing:", e);
    }
    process.exit(0);
}
run();
