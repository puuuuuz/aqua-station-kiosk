module.exports = async function handler(req, res) {
    try {
        const { initializeApp } = await import("firebase/app");
        const { getFirestore, collection, getDocs, doc, updateDoc, getDoc, query, where, setDoc } = await import("firebase/firestore");

        const firebaseConfig = {
            apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
            projectId: "siam-circuit",
        };
        const app = initializeApp(firebaseConfig, "cron-" + Date.now());
        const db = getFirestore(app);
        const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
        console.log(`[CRON] Starting Daily Quota Reset for ${todayStr}...`);
        
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
        }
        
        const logMsg = `🟢 ทำงานสำเร็จเมื่อ ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} (อัปเดต ${updated} คน)`;
        await setDoc(doc(db, "settings", "kiosk_config"), { lastCronStatus: logMsg }, { merge: true });
        
        console.log(logMsg);
        res.status(200).json({ success: true, message: logMsg, updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}