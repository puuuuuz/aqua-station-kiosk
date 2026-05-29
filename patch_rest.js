const fs = require('fs');
let code = fs.readFileSync('liff-app.html', 'utf8');

// Patch 1: doRegister setDoc bypass
const oldRegister = `                // Write user doc to Firestore — same collection the admin panel reads from
                const setDocPromise = setDoc(doc(db, "users", uid), {
                    displayName: name,
                    fullName: name,
                    phone: document.getElementById('reg-phone') ? document.getElementById('reg-phone').value.replace(/[^0-9]/g, '') : '',
                    province: prov,
                    district: dist,
                    subdistrict: subDist,
                    idCardBase64: idCardBase64,
                    lineUid: uid,
                    status: 'pending',
                    photoUrl: liffProfile ? (liffProfile.pictureUrl || '') : '',
                    totalVol: 0,
                    registeredAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('การเชื่อมต่อกับเซิร์ฟเวอร์ขัดข้อง (Timeout) โปรดลองใหม่อีกครั้ง')), 10000));
                await Promise.race([setDocPromise, timeoutPromise]);`;

const newRegister = `                // REST API Bypass for LINE In-App Browser compatibility
                const firestoreRestUrl = \`https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/users/\${uid}\`;
                const payload = {
                    fields: {
                        displayName: { stringValue: name },
                        fullName: { stringValue: name },
                        phone: { stringValue: document.getElementById('reg-phone') ? document.getElementById('reg-phone').value.replace(/[^0-9]/g, '') : '' },
                        province: { stringValue: prov },
                        district: { stringValue: dist },
                        subdistrict: { stringValue: subDist },
                        idCardBase64: { stringValue: idCardBase64 },
                        lineUid: { stringValue: uid },
                        status: { stringValue: 'pending' },
                        photoUrl: { stringValue: liffProfile ? (liffProfile.pictureUrl || '') : '' },
                        totalVol: { integerValue: "0" },
                        registeredAt: { timestampValue: new Date().toISOString() },
                        updatedAt: { timestampValue: new Date().toISOString() }
                    }
                };

                const res = await fetch(firestoreRestUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error('REST API Error: ' + res.status + ' ' + errText);
                }`;

if (code.includes(oldRegister)) {
    code = code.replace(oldRegister, newRegister);
    console.log("Patched doRegister successfully.");
} else {
    console.log("Could not find oldRegister block.");
}

// Patch 2: liff.init getDoc bypass
const oldCheck = `                            // 1. Check by Document ID (Most efficient)
                            let userSnap = await getDoc(doc(db, "users", liffProfile.userId));
                            let isRegistered = userSnap.exists();`;

const newCheck = `                            // 1. Check by Document ID using REST API to bypass Firebase WebSocket blocks
                            const checkUrl = \`https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/users/\${liffProfile.userId}\`;
                            let isRegistered = false;
                            try {
                                const checkRes = await fetch(checkUrl);
                                if (checkRes.ok) isRegistered = true;
                            } catch(e) { console.warn("REST check failed", e); }`;

if (code.includes(oldCheck)) {
    code = code.replace(oldCheck, newCheck);
    console.log("Patched liff.init successfully.");
} else {
    console.log("Could not find oldCheck block.");
}

fs.writeFileSync('liff-app.html', code);
