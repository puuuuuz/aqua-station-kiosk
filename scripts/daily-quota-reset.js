const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
    console.error('Usage: node daily-quota-reset.js <service_account_path>');
    process.exit(1);
}

const content = fs.readFileSync(serviceAccountPath, 'utf8');
if (!content || content.trim() === '') {
    console.error('❌ Error: Service Account JSON file is empty!');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(content);
} catch (e) {
    console.error('❌ Error: Failed to parse Service Account JSON.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function resetQuotas() {
    try {
        console.log('🚀 Starting Daily Quota Reset Cron Job...');
        const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' });
        console.log('📅 Today in Asia/Bangkok: ' + todayStr);

        const snap = await db.collection('users').get();
        let fixedCount = 0;
        let batch = db.batch();
        let batchCount = 0;

        for (let d of snap.docs) {
            const data = d.data();
            const isApproved = (data.status === 'approved' || data.status === 'active');
            const notResetToday = (data.lastQuotaResetDate !== todayStr);
            
            if (isApproved && notResetToday) {
                const targetQuota = parseFloat(data.quota ?? 2.0);
                const docRef = db.collection('users').doc(d.id);
                
                batch.update(docRef, {
                    litersLeft: targetQuota,
                    lastQuotaResetDate: todayStr
                });
                
                fixedCount++;
                batchCount++;
                console.log('✅ Queueing Reset: ' + (data.fullName || data.displayName) + ' -> ' + targetQuota + 'L');
                
                if (batchCount === 500) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }

        console.log('✅ Successfully reset daily quota for ' + fixedCount + ' users!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetQuotas();