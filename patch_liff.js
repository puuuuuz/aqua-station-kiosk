const fs = require('fs');
let code = fs.readFileSync('liff-app.html', 'utf8');

// 1. Fix showLoading so it doesn't automatically disappear after 1s if duration is undefined
const oldLoading = `        function showLoading(text, duration, callback) {
            const overlay = document.getElementById('loadingOverlay');
            const txt = document.getElementById('loadingText');
            if (txt) txt.textContent = text;
            if (overlay) overlay.classList.add('show');
            setTimeout(() => {
                if (overlay) overlay.classList.remove('show');
                callback && callback();
            }, duration || 1000);
        }`;
const newLoading = `        function showLoading(text, duration, callback) {
            const overlay = document.getElementById('loadingOverlay');
            const txt = document.getElementById('loadingText');
            if (txt) txt.textContent = text;
            if (overlay) overlay.classList.add('show');
            if (duration) {
                setTimeout(() => {
                    if (overlay) overlay.classList.remove('show');
                    callback && callback();
                }, duration);
            }
        }`;
if (code.includes(oldLoading)) {
    code = code.replace(oldLoading, newLoading);
}

// 2. Add Promise.race timeout to setDoc in doRegister
const oldSetDoc = `await setDoc(doc(db, "users", uid), {
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
                }, { merge: true });`;

const newSetDoc = `const setDocPromise = setDoc(doc(db, "users", uid), {
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

if (code.includes(oldSetDoc)) {
    code = code.replace(oldSetDoc, newSetDoc);
}

fs.writeFileSync('liff-app.html', code);
console.log("Patched liff-app.html successfully");
