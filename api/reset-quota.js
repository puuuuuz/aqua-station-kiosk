const admin = require('firebase-admin');

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        admin.initializeApp();
    }
}

const db = admin.firestore();
const MAX_DAILY_QUOTA = 2.0; // 🛡️ HARD CAP: 2 ลิตร/วัน/คน

export default async function handler(req, res) {
    // Auth check for Cron
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.CRON_SECRET) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
        console.log(`[RESET-QUOTA] Starting daily quota reset for ${todayStr}`);

        // 1. Read quota config
        let inAreaVol = MAX_DAILY_QUOTA;
        let outAreaVol = MAX_DAILY_QUOTA;
        let inAreaSubdistricts = [];
        let inAreaDistricts = [];
        let inAreaProvinces = [];

        try {
            const configDoc = await db.collection("settings").doc("quota_config").get();
            if (configDoc.exists) {
                const conf = configDoc.data();
                inAreaVol = Math.min(parseFloat(conf.inAreaVol || MAX_DAILY_QUOTA), MAX_DAILY_QUOTA);
                outAreaVol = Math.min(parseFloat(conf.outAreaVol || MAX_DAILY_QUOTA), MAX_DAILY_QUOTA);
                inAreaSubdistricts = conf.inAreaSubdistricts || [];
                inAreaDistricts = conf.inAreaDistricts || [];
                inAreaProvinces = conf.inAreaProvinces || [];
            }
        } catch (configErr) {
            console.error("[RESET-QUOTA] Config fetch failed:", configErr);
        }

        // 2. Get all approved users
        const usersSnap = await db.collection("users")
            .where("status", "in", ["approved", "active"])
            .get();

        if (usersSnap.empty) {
            console.log("[RESET-QUOTA] No approved users found.");
            return res.status(200).json({ success: true, message: "No users to reset", timestamp: todayStr });
        }

        // 3. Batch update litersLeft for each user
        let totalReset = 0;
        let batchCount = 0;
        let batch = db.batch();

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();

            // Skip users already reset today
            if (userData.lastQuotaResetDate === todayStr) {
                continue;
            }

            // Calculate max quota for this user
            let calculatedMax = MAX_DAILY_QUOTA;

            if (userData.customQuota !== undefined && userData.customQuota !== null && userData.customQuota !== "") {
                calculatedMax = Math.min(parseFloat(userData.customQuota), MAX_DAILY_QUOTA);
            } else {
                const isAreaMatch = inAreaSubdistricts.includes(userData.subdistrict) ||
                                    inAreaDistricts.includes(userData.district) ||
                                    inAreaProvinces.includes(userData.province);
                calculatedMax = isAreaMatch ? inAreaVol : outAreaVol;
            }

            // 🛡️ HARD CAP
            calculatedMax = Math.min(calculatedMax, MAX_DAILY_QUOTA);

            batch.update(userDoc.ref, {
                litersLeft: calculatedMax,
                lastQuotaResetDate: todayStr
            });

            totalReset++;
            batchCount++;

            // Firestore batch limit: 500 operations
            if (batchCount >= 450) {
                await batch.commit();
                console.log(`[RESET-QUOTA] Committed batch of ${batchCount} users`);
                batch = db.batch();
                batchCount = 0;
            }
        }

        // Commit remaining
        if (batchCount > 0) {
            await batch.commit();
        }

        const message = `Reset ${totalReset} users' quota to max ${MAX_DAILY_QUOTA}L for ${todayStr}`;
        console.log(`[RESET-QUOTA] ✅ ${message}`);
        res.status(200).json({
            success: true,
            message: message,
            totalReset: totalReset,
            maxQuota: MAX_DAILY_QUOTA,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[RESET-QUOTA ERROR]', error);
        res.status(500).json({ error: error.message });
    }
}
