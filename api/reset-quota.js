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

        const q = query(collection(db, "users")); // ดึงทุกคน ไม่กรอง status เพื่อป้องกันการตกหล่น
        const snap = await getDocs(q);

        let updated = 0;
        let batch = import("firebase/firestore").then(m => m.writeBatch(db));
        const { writeBatch } = await import("firebase/firestore");
        batch = writeBatch(db);
        let batchCount = 0;
        const batches = [];

        for (const d of snap.docs) {
            const userData = d.data();
            if (userData.lastQuotaResetDate === todayStr) continue;

            let calculatedMax = 2;
            if (userData.customQuota !== undefined && userData.customQuota !== null && userData.customQuota !== "") {
                let parsed = parseFloat(userData.customQuota);
                if (!Number.isNaN(parsed)) {
                    calculatedMax = Math.min(parsed, 2);
                }
            } else {
                const isAreaMatch = inAreaSubdistricts.includes(userData.subdistrict) ||
                    inAreaDistricts.includes(userData.district) ||
                    inAreaProvinces.includes(userData.province);
                calculatedMax = isAreaMatch ? inAreaVol : outAreaVol;
            }
            calculatedMax = Math.min(calculatedMax, 2);

            batch.update(d.ref, {
                litersLeft: calculatedMax,
                lastQuotaResetDate: todayStr
            });
            updated++;
            batchCount++;

            if (batchCount === 490) {
                batches.push(batch.commit());
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            batches.push(batch.commit());
        }

        await Promise.all(batches);

        const logMsg = `🟢 ทำงานสำเร็จเมื่อ ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} (อัปเดต ${updated} คน)`;

        // 📚 Keep an array of last 5 cron statuses
        let currentHistory = [];
        try {
            const currentConfig = await getDoc(doc(db, "settings", "kiosk_config"));
            if (currentConfig.exists()) {
                const confData = currentConfig.data();
                if (Array.isArray(confData.cronStatusHistory)) {
                    currentHistory = confData.cronStatusHistory;
                } else if (confData.lastCronStatus) {
                    currentHistory = [confData.lastCronStatus];
                }
            }
        } catch (err) { console.warn("Failed to get current config history:", err); }

        currentHistory.unshift(logMsg);
        currentHistory = currentHistory.slice(0, 5); // Keep last 5 runs

        await setDoc(doc(db, "settings", "kiosk_config"), {
            lastCronStatus: logMsg,
            cronStatusHistory: currentHistory
        }, { merge: true });

        console.log(logMsg);
        res.status(200).json({ success: true, message: logMsg, updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}