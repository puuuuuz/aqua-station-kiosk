const admin = require('firebase-admin');
const fs = require('fs');

// Read version and URL from arguments
const newVersion = process.argv[2];
const apkUrl = process.argv[3];
const serviceAccountPath = process.argv[4];
const webZipUrl = process.argv[5] || "";

if (!newVersion || !apkUrl || !serviceAccountPath) {
    console.error("Usage: node update-ota.js <version> <url> <service_account_path> [web_zip_url]");
    process.exit(1);
}

const content = fs.readFileSync(serviceAccountPath, 'utf8');
if (!content || content.trim() === "") {
    console.error("❌ Error: Service Account JSON file is empty!");
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(content);
} catch (e) {
    console.error("❌ Error: Failed to parse Service Account JSON. Please check if the secret in GitHub is correct.");
    console.error("Technical details:", e.message);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateOTA() {
    try {
        console.log(`🚀 Updating OTA to v${newVersion}...`);
        
        const updateData = {
            latest_apk_version: newVersion,
            apk_url: apkUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (webZipUrl) {
            updateData.latest_web_version = newVersion;
            updateData.web_zip_url = webZipUrl;
        }

        await db.collection('settings').doc('kiosk_config').set(updateData, { merge: true });
        console.log("✅ Firebase updated successfully!");
    } catch (error) {
        console.error("❌ Error updating Firebase:", error);
        process.exit(1);
    }
}

updateOTA();
