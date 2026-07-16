const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const machineId = '1799db531424ebeb';

  // Calculate multiplier: target (110) / current (168)
  const multiplier = 110 / 168; // 0.6547...

  await db.collection('machines').doc(machineId).set({
    ota_target_version: admin.firestore.FieldValue.delete(),
    ota_apk_url: admin.firestore.FieldValue.delete(),
    ota_force_update: admin.firestore.FieldValue.delete(),
    tdsInMultiplier: multiplier.toFixed(3) // "0.655"
  }, { merge: true });

  console.log(`✅ Success! Stopped OTA spam and updated tdsInMultiplier = ${multiplier.toFixed(3)}`);
  process.exit(0);
}

run();
