const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'siam-circuit'
});

const db = admin.firestore();

async function cleanup() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // 🛑 14 DAYS AGO
  const threshold = admin.firestore.Timestamp.fromDate(twoWeeksAgo);

  console.log(`Cleaning data older than: ${twoWeeksAgo.toISOString()}`);

  const collections = ['transactions', 'sessions', 'commands'];
  
  for (const colName of collections) {
    console.log(`Checking collection: ${colName}...`);
    const colRef = db.collection(colName);
    
    // Try different timestamp field names
    const fields = ['time', 'timestamp', 'createdAt'];
    let allDocs = [];

    for (const field of fields) {
        const snapshot = await colRef.where(field, '<', threshold).get().catch(() => null);
        if (snapshot && !snapshot.empty) {
            snapshot.docs.forEach(d => {
                if (!allDocs.find(x => x.id === d.id)) allDocs.push(d);
            });
        }
    }

    if (allDocs.length === 0) {
      console.log(`No documents older than 14 days found in ${colName}.`);
      continue;
    }

    console.log(`Found ${allDocs.length} documents to delete in ${colName}.`);
    
    const batchSize = 500;
    for (let i = 0; i < allDocs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = allDocs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted chunk ${Math.floor(i/batchSize) + 1} (${chunk.length} docs) from ${colName}`);
    }
  }
  console.log('Cleanup complete!');
}

cleanup().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
