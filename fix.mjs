import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf8');

// 1. Remove the old ensureUserQuotaReset
content = content.replace(
    /\/\/ 🚀 Auto-reset user quota if it's a new day!\n\s*await window\.ensureUserQuotaReset\(uSnap\.id, ud\);/,
    "// Auto-reset moved below after phone resolution"
);

// 2. Find the primaryData resolution block and update it
const targetBlock = `                                            let primaryData = ud;
                                            if (ud.phone) {
                                                const phoneSnap = await window.collection(window.db, "users").where("phone", "==", ud.phone).get();
                                                if (!phoneSnap.empty) {
                                                    primaryData = phoneSnap.docs[0].data();
                                                }
                                            }`;

const newBlock = `                                            let primaryData = ud;
                                            let primaryDocId = uSnap.id;
                                            if (ud.phone) {
                                                const phoneSnap = await window.collection(window.db, "users").where("phone", "==", ud.phone).get();
                                                if (!phoneSnap.empty) {
                                                    primaryData = phoneSnap.docs[0].data();
                                                    primaryDocId = phoneSnap.docs[0].id;
                                                }
                                            }
                                            
                                            // 🚀 Auto-reset user quota if it's a new day! (Running on the correct linked profile)
                                            await window.ensureUserQuotaReset(primaryDocId, primaryData);`;

content = content.replace(targetBlock, newBlock);

fs.writeFileSync('station-v121.html', content, 'utf8');
console.log("Replaced successfully!");
