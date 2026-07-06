const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function run() {
    try {
        console.log("Searching for users with name containing เพ็ญนภา...");
        
        // Try searching users collection
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        let userDoc = null;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.includes("เพ็ญนภา")) {
                console.log("Found User:", doc.id, data);
                userDoc = { id: doc.id, ...data };
            }
        });
        
        if (!userDoc) {
             console.log("User not found in 'users' collection.");
        } else {
             console.log("\nSearching for transactions for this user...");
             const transRef = db.collection('transactions');
             const transSnap = await transRef.where('userUid', '==', userDoc.id).orderBy('createdAt', 'desc').limit(10).get();
             transSnap.forEach(t => {
                 console.log("Transaction:", t.id, t.data());
             });
        }
        
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

run();
