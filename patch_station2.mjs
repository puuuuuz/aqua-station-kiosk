import fs from 'fs';

const file = './www/station-v121.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Phone Login Pre-deduct
const phonePreDeductOld = `                    // 🛡️ Safe Pre-Deduct: Only deduct regular daily quota (litersLeft = 0) and preserve extraQuota!
                    await window.updateDoc(window.doc(window.db, "users", userDoc.id), {
                        litersLeft: 0
                    });`;
const phonePreDeductNew = `                    // 🛡️ Safe Pre-Deduct: Only deduct regular daily quota (litersLeft = 0) and preserve extraQuota!
                    window.updateDoc(window.doc(window.db, "users", userDoc.id), {
                        litersLeft: 0
                    }).catch(e => console.error("Sync delayed", e));`;
content = content.replace(phonePreDeductOld, phonePreDeductNew);

// 2. QR Scan Pre-deduct
const qrPreDeductOld = `                                            const preDeductLeft = Math.max(0, remainingQuota - finalDispenseVol);
                                            await window.updateDoc(window.doc(window.db, "users", data.userUid), {
                                                litersLeft: preDeductLeft
                                            });`;
const qrPreDeductNew = `                                            const preDeductLeft = Math.max(0, remainingQuota - finalDispenseVol);
                                            window.updateDoc(window.doc(window.db, "users", data.userUid), {
                                                litersLeft: preDeductLeft
                                            }).catch(e => console.error("Sync delayed", e));`;
content = content.replace(qrPreDeductOld, qrPreDeductNew);

// 3. Phone Login Create Session
const phoneSessionOld = `                // 🆕 ALWAYS CREATE A NEW SESSION FOR EVERY LOGIN TO PREVENT TOKEN REUSE BUG
                await window.setDoc(window.doc(window.db, "sessions", id), {`;
const phoneSessionNew = `                // 🆕 ALWAYS CREATE A NEW SESSION FOR EVERY LOGIN TO PREVENT TOKEN REUSE BUG
                window.setDoc(window.doc(window.db, "sessions", id), {`;
content = content.replace(phoneSessionOld, phoneSessionNew);

// 4. We also need to add catch to the end of setDoc in Phone Login
const phoneSessionEndOld = `                    vol: window.maxLiters,
                    timestamp: window.serverTimestamp()
                });`;
const phoneSessionEndNew = `                    vol: window.maxLiters,
                    timestamp: window.serverTimestamp()
                }).catch(e => console.error("Sync delayed", e));`;
content = content.replace(phoneSessionEndOld, phoneSessionEndNew);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched station-v121.html successfully.");
