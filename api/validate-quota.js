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
const MAX_DAILY_QUOTA = 2.0;

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userUid, requestedVol, kioskId } = req.body || {};

    if (!userUid || !requestedVol || !kioskId) {
        return res.status(400).json({ error: 'Missing required fields: userUid, requestedVol, kioskId' });
    }

    try {
        const userRef = db.collection("users").doc(userUid);

        // Use Firestore transaction for atomic read-and-deduct
        const result = await db.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists) {
                return { allowed: false, reason: 'ไม่พบข้อมูลสมาชิก', remaining: 0 };
            }

            const userData = userSnap.data();

            // Check status
            const status = (userData.status || '').toLowerCase();
            if (status !== 'approved' && status !== 'active') {
                return { allowed: false, reason: 'สถานะสมาชิก: ' + (userData.status || 'ไม่ทราบ'), remaining: 0 };
            }

            // Check quota reset for new day
            const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
            let currentLeft = parseFloat(userData.litersLeft ?? MAX_DAILY_QUOTA);

            if (userData.lastQuotaResetDate !== todayStr) {
                // New day — reset quota
                let calculatedMax = MAX_DAILY_QUOTA;
                if (userData.customQuota !== undefined && userData.customQuota !== null && userData.customQuota !== "") {
                    let parsedQuota = parseFloat(userData.customQuota);
                    if (!Number.isNaN(parsedQuota)) {
                        calculatedMax = Math.min(parsedQuota, MAX_DAILY_QUOTA);
                    }
                }
                currentLeft = calculatedMax;
            }

            if (Number.isNaN(currentLeft)) {
                currentLeft = 0;
            }

            // 🛡️ HARD CAP
            currentLeft = Math.min(currentLeft, MAX_DAILY_QUOTA);

            let vol = parseFloat(requestedVol);
            if (Number.isNaN(vol)) vol = 0;
            vol = Math.min(vol, currentLeft, MAX_DAILY_QUOTA);

            if (vol <= 0 || currentLeft <= 0) {
                return { allowed: false, reason: 'โควตาไม่เพียงพอ (คงเหลือ ' + currentLeft.toFixed(2) + ' ลิตร)', remaining: currentLeft };
            }

            // 🔒 ATOMIC DEDUCT
            const newLeft = Math.max(0, currentLeft - vol);
            transaction.update(userRef, {
                litersLeft: newLeft,
                lastQuotaResetDate: todayStr,
                lastValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastValidatedKiosk: kioskId
            });

            return {
                allowed: true,
                approvedVol: vol,
                remaining: newLeft,
                userName: userData.name || userData.phone || 'สมาชิก'
            };
        });

        console.log(`[VALIDATE-QUOTA] User ${userUid} @ ${kioskId}: ${JSON.stringify(result)}`);
        res.status(200).json(result);

    } catch (error) {
        console.error('[VALIDATE-QUOTA ERROR]', error);
        res.status(500).json({ error: error.message, allowed: false });
    }
}
