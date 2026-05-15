const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'siam-circuit'
});

const db = admin.firestore();

async function inspect() {
  const collections = await db.listCollections();
  console.log(`Found ${collections.length} collections.`);

  for (const col of collections) {
    const snapshot = await col.limit(1).get();
    const countSnapshot = await col.count().get();
    const count = countSnapshot.data().count;
    console.log(`Collection: ${col.id} | Documents: ${count}`);
    
    if (count > 0) {
        const firstDoc = snapshot.docs[0].data();
        console.log(`  Sample keys: ${Object.keys(firstDoc).join(', ')}`);
    }
  }
}

inspect().catch(console.error);
