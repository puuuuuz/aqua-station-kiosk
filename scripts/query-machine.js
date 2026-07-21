const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
    try {
        console.log("Searching for machine: เทศบาลด่านสำโรง...");
        const machinesRef = db.collection('machines');
        const snapshot = await machinesRef.get();
        let found = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.includes("เทศบาลด่านสำโรง")) {
                console.log("Found Machine:", doc.id);
                console.log(" - Name:", data.name);
                console.log(" - Version:", data.app_version || data.apk_version || data.version);
                if (data.last_seen) {
                    const date = data.last_seen.toDate ? data.last_seen.toDate() : new Date(data.last_seen);
                    console.log(" - Last Seen:", date.toLocaleString());
                } else {
                    console.log(" - Last Seen: None");
                }
                console.log(" - Full Data:", JSON.stringify(data, null, 2));
                found = true;
            }
        });
        if (!found) console.log("Machine not found.");
    } catch (e) { console.error("Error:", e); }
    process.exit(0);
}
run();
