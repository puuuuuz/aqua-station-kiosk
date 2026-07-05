const admin = require('firebase-admin');
const fs = require('fs');

const machineId = process.argv[2];
const apkVersion = process.argv[3];
const apkUrl = process.argv[4] || "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/app-debug.apk";

// For Web OTA (Optional)
const webVersion = process.argv[5];
const webZipUrl = process.argv[6] || "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/www.zip";

if (!machineId || !apkVersion) {
    console.error("Usage: node update-machine.js <machine_id> <apk_version> [apk_url] [web_version] [web_zip_url]");
    console.error("Example: node scripts/update-machine.js 1799db531424ebeb 2.0.58");
    process.exit(1);
}

// Ensure you have service-account.json in the root folder
const serviceAccountPath = './service-account.json';
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Error: service-account.json not found in the current directory!");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateMachine() {
    try {
        console.log(`🚀 Sending OTA Update Command to Machine: ${machineId}...`);
        
        const updateData = {
            ota_target_version: apkVersion,
            ota_apk_url: apkUrl,
            ota_force_update: true
        };

        if (webVersion) {
            updateData.target_web_version = webVersion;
            updateData.target_web_zip_url = webZipUrl;
        }

        await db.collection('machines').doc(machineId).set(updateData, { merge: true });
        
        console.log(`✅ Success! Machine ${machineId} will now download APK v${apkVersion}`);
        if (webVersion) {
            console.log(`🌐 Also triggered Web OTA to v${webVersion}`);
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ Error updating Firebase:", error);
        process.exit(1);
    }
}

updateMachine();
