const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
async function run() {
    const doc = await db.collection("users").doc("Ud49180594b0f876fb5b80867503d1955").get();
    console.log("User:", doc.id, doc.data());
    const transSnap = await db.collection("sessions").where("userUid", "==", doc.id).orderBy("createdAt", "desc").limit(10).get();
    transSnap.forEach(t => console.log("Session:", t.id, t.data()));
    process.exit(0);
}
run();
