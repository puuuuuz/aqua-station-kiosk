import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    projectId: "siam-circuit",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
    console.log(`[FORCE RESET] Starting manual reset for ${todayStr}...`);
    
    const configSnap = await getDoc(doc(db, "settings", "quota_config"));
    let inAreaVol = 2, outAreaVol = 2;
    let inAreaSubdistricts = [], inAreaDistricts = [], inAreaProvinces = [];
    
    if (configSnap.exists()) {
        const conf = configSnap.data();
        inAreaVol = Math.min(parseFloat(conf.inAreaVol || 2), 2);
        outAreaVol = Math.min(parseFloat(conf.outAreaVol || 2), 2);
        inAreaSubdistricts = conf.inAreaSubdistricts || [];
        inAreaDistricts = conf.inAreaDistricts || [];
        inAreaProvinces = conf.inAreaProvinces || [];
    }

    const q = query(collection(db, "users"), where("status", "in", ["approved", "active"]));
    const snap = await getDocs(q);
    
    let updated = 0;
    for (const d of snap.docs) {
        const userData = d.data();
        if (userData.lastQuotaResetDate === todayStr) continue;

        let calculatedMax = 2;
        if (userData.customQuota !== undefined && userData.customQuota !== null && userData.customQuota !== "") {
            calculatedMax = Math.min(parseFloat(userData.customQuota), 2);
        } else {
            const isAreaMatch = inAreaSubdistricts.includes(userData.subdistrict) ||
                                inAreaDistricts.includes(userData.district) ||
                                inAreaProvinces.includes(userData.province);
            calculatedMax = isAreaMatch ? inAreaVol : outAreaVol;
        }
        calculatedMax = Math.min(calculatedMax, 2);

        await updateDoc(d.ref, {
            litersLeft: calculatedMax,
            lastQuotaResetDate: todayStr
        });
        updated++;
        if (updated % 50 === 0) console.log(`...Updated ${updated} users`);
    }
    console.log(`✅ Force Reset Complete: ${updated} users updated to max quota for ${todayStr}`);
    process.exit(0);
}
run();
