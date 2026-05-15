const admin = require('firebase-admin');

if (!admin.apps.length) {
    // If you have FIREBASE_SERVICE_ACCOUNT env var in Vercel
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback for local testing or if initialized elsewhere
        admin.initializeApp();
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    // Basic auth check for Cron (Setup CRON_SECRET in Vercel)
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        // For testing, we might allow it if no secret is set yet, but not recommended
        if (process.env.CRON_SECRET) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const threshold = admin.firestore.Timestamp.fromDate(oneMonthAgo);

        const collectionsToClean = ['transactions', 'sessions'];
        let totalDeleted = 0;

        for (const colName of collectionsToClean) {
            const collectionRef = db.collection(colName);
            // Delete docs where time < threshold
            const snapshot = await collectionRef.where('time', '<', threshold).get();
            
            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
            }
        }

        console.log(`[CLEANUP] Deleted ${totalDeleted} old documents.`);
        res.status(200).json({ 
            success: true, 
            message: `Deleted ${totalDeleted} documents older than 1 month.`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CLEANUP ERROR]', error);
        res.status(500).json({ error: error.message });
    }
}
