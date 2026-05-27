import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf8');

// 1. Remove the deferred script tags
content = content.replace(/<script src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.8\.1\/firebase-app-compat\.js" defer><\/script>\n?/, '');
content = content.replace(/<script src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.8\.1\/firebase-firestore-compat\.js" defer><\/script>\n?/, '');

// 2. Remove the module wrapper and replace with dynamic loader
// We need to find the <script type="module"> block
const moduleBlockRegex = /<script type="module">([\s\S]*?)<\/script>/;
const match = content.match(moduleBlockRegex);

if (match) {
    let moduleCode = match[1];
    
    const newScript = `
    <script>
        // Restored Safety Code
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                if (typeof dispenseSession !== 'undefined' && dispenseSession.active && !dispenseSession.paused) {
                    console.warn('⚠️ App went to background while dispensing! Stopping flow for safety.');
                    // Force pause command immediately
                    if (typeof sendPacket === 'function') {
                        sendPacket(0xC6, 0x50, [0x00, 0x00], 'EMERGENCY-PUMP-STOP');
                        setTimeout(() => sendPacket(0xC3, 0x50, [0x00, 0x00], 'EMERGENCY-VALVE-STOP'), 100);
                    }
                    dispenseSession.paused = true;
                    window._activeFlowStartTime = null;
                    // Snap UI
                    if (typeof updateDispenseScreen === 'function') {
                        let actualL = (Number(dispenseSession.accumulatedPulses) || 0) / (typeof K_FACTOR !== 'undefined' ? K_FACTOR : 450);
                        updateDispenseScreen(actualL, dispenseSession.targetLiters, dispenseSession.accumulatedPulses);
                    }
                    if (typeof refreshDispenseButtons === 'function') refreshDispenseButtons();
                }
            }
        });

        window.addEventListener('beforeunload', function() {
            if (typeof dispenseSession !== 'undefined' && dispenseSession.active) {
                if (window.AndroidSerial && window.AndroidSerial.sendHex) {
                    window.AndroidSerial.sendHex('C65000000000');
                }
                if (typeof sendPacket === 'function') {
                    sendPacket(0xC6, 0x50, [0x00, 0x00], 'UNLOAD-PUMP-STOP');
                    sendPacket(0xC3, 0x50, [0x00, 0x00], 'UNLOAD-VALVE-STOP');
                }
            }
        });

        // 🚀 DYNAMIC FIREBASE LOADER (Prevents blocking window.onload)
        window.addEventListener('load', () => {
            console.log("🚀 [SYSTEM] Window loaded! Injecting Firebase...");
            const s1 = document.createElement('script');
            s1.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js";
            s1.onload = () => {
                const s2 = document.createElement('script');
                s2.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js";
                s2.onload = () => {
                    console.log("🔥 [FIREBASE] Scripts downloaded, initializing...");
                    try {
                        const firebaseConfig = {
                            apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
                            authDomain: "siam-circuit.firebaseapp.com",
                            projectId: "siam-circuit",
                            storageBucket: "siam-circuit.firebasestorage.app",
                            messagingSenderId: "330527536801",
                            appId: "1:330527536801:web:c0132854940609dd3f62e",
                        };
                        
                        firebase.initializeApp(firebaseConfig);
                        window.db = firebase.firestore(); // EXPORT TO GLOBAL
                        
                        window.lastSuccessfulWriteTime = Date.now();
                        window.doc = (dbObj, coll, id) => dbObj.collection(coll).doc(id);
                        window.getDoc = (docRef) => docRef.get().then(res => { window.lastSuccessfulWriteTime = Date.now(); return res; });
                        window.setDoc = (docRef, data) => docRef.set(data, { merge: true }).then(res => { window.lastSuccessfulWriteTime = Date.now(); return res; });
                        window.updateDoc = (docRef, data) => docRef.update(data).then(res => { window.lastSuccessfulWriteTime = Date.now(); return res; });
                        window.addDoc = (collRef, data) => collRef.add(data).then(res => { window.lastSuccessfulWriteTime = Date.now(); return res; });
                        window.serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
                        window.collection = (dbObj, coll) => dbObj.collection(coll);
                        window.increment = (n) => firebase.firestore.FieldValue.increment(n);
                        window.onSnapshot = (ref, cb, errCb) => {
                            console.log("📡 [FIREBASE] Setting up listener on:", ref.path);
                            return ref.onSnapshot(snap => { window.lastSuccessfulWriteTime = Date.now(); cb(snap); }, err => {
                                console.error("🛑 [FIREBASE] Listener Error:", err);
                                if (errCb) errCb(err);
                            });
                        };
                        
                        window.query = (collRef) => collRef;
                        window.where = (field, op, val) => { };
                        window.getDocs = (q) => q.get().then(res => { window.lastSuccessfulWriteTime = Date.now(); return res; });

                        // Run Startup Logger
                        setTimeout(async () => {
                            try {
                                let hwId = window.DEVICE_ID;
                                if (!hwId && window.AndroidSerial && typeof window.AndroidSerial.getDeviceId === 'function') {
                                    hwId = window.AndroidSerial.getDeviceId().toLowerCase();
                                }
                                if (!hwId) return;
                                const now = new Date();
                                let reason = localStorage.getItem('restart_reason') || 'normal_boot';
                                localStorage.removeItem('restart_reason');
                                if (now.getHours() === 4 && now.getMinutes() <= 5) reason = 'daily_maintenance';
                                let details = 'ตัวตู้ทำการเริ่มต้นระบบแอปพลิเคชันสำเร็จ (Application Startup / Booted Successfully)';
                                if (reason === 'remote_reboot') details = 'ตัวตู้ทำการรีสตาร์ทแอปพลิเคชันจากระยะไกลสำเร็จ (Remote Reboot Executed Successfully)';
                                else if (reason === 'daily_maintenance') details = 'ระบบทำการรีสตาร์ทเพื่อบำรุงรักษาประจำวันสำเร็จ (04:00 AM Daily Maintenance Restart)';
                                const appVer = window.AndroidSerial && typeof window.AndroidSerial.getAppVersion === 'function' ? window.AndroidSerial.getAppVersion() : '1.38 (RESTORED)';
                                await window.db.collection("machine_logs").add({
                                    machineId: hwId, machineName: hwId, status: 'app_start',
                                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                                    details: \`\${details} [เวอร์ชัน \${appVer}]\`
                                });
                            } catch (e) { }
                        }, 3000);

                        console.log("🔥 [FIREBASE] Compat Initialized and Exported (V2.11)");
                        
                        // NOW we can run the database-dependent logic!
                        if (typeof window.syncIdToUI === 'function') {
                            window.syncIdToUI();
                        }

                    } catch (e) {
                        console.error("❌ FIREBASE INIT ERROR:", e);
                    }
                };
                document.body.appendChild(s2);
            };
            document.body.appendChild(s1);
        });
    </script>
`;
    content = content.replace(moduleBlockRegex, newScript);
}

// 3. Remove syncIdToUI from DOMContentLoaded
// It's located in the huge DOMContentLoaded block near line 2710
content = content.replace(/syncIdToUI\(\);\s*/, '');
// Also expose syncIdToUI to window so the dynamic loader can call it
content = content.replace(/function syncIdToUI\(\)/, 'window.syncIdToUI = function syncIdToUI()');

// 4. Change all references of `doc(db,` to `doc(window.db,` just to be absolutely bulletproof
content = content.replace(/doc\(db,/g, 'doc(window.db,');
content = content.replace(/collection\(db,/g, 'collection(window.db,');

fs.writeFileSync('station-v121.html', content, 'utf8');
console.log("station-v121.html patched for fully dynamic Firebase loading!");
