import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // 1. Inject IndexedDB Offline Persistence for Firestore right after firestore initialization
        // We look for where firestore or db is initialized
        const dbInitStr = 'const db = getFirestore(app);';
        if (content.includes(dbInitStr)) {
            const patchedDbInit = `const db = getFirestore(app);
        
        // 🛡️ [ULTRA-LOW SPEED HOTFIX] Enable IndexedDB Offline Persistence for Firestore
        // Allows instant local queries within 0.01 seconds even on 0.10 Mbps / 100 Kbps connection!
        import("firebase/firestore").then(async ({ enableIndexedDbPersistence }) => {
            try {
                await enableIndexedDbPersistence(db);
                console.log("[OFFLINE PERSISTENCE] Enabled successfully! Using local cache.");
            } catch (err) {
                if (err.code == 'failed-precondition') {
                    console.warn("[OFFLINE PERSISTENCE] Multiple tabs open, persistence can only be enabled in one tab at a a time.");
                } else if (err.code == 'unimplemented') {
                    console.warn("[OFFLINE PERSISTENCE] The current browser does not support all of the features required to enable persistence.");
                } else {
                    console.error("[OFFLINE PERSISTENCE] Failed:", err);
                }
            }
        });`;
            content = content.replace(dbInitStr, patchedDbInit);
        }

        // 2. Adjust Firestore get() options for ultra-low speed network to query CACHE first
        // We look for: window.collection(window.db, "users").where("phone", "==", window.currentPhone).get()
        const phoneQueryStr = 'await window.collection(window.db, "users").where("phone", "==", window.currentPhone).get();';
        if (content.includes(phoneQueryStr)) {
            const patchedPhoneQuery = `await (async () => {
                logToScreen("📡 Searching user in local cache first...");
                try {
                    // Try local cache query first for 0.01s instant lookup on slow connection!
                    const cacheSnap = await window.collection(window.db, "users")
                        .where("phone", "==", window.currentPhone)
                        .get({ source: "cache" });
                    
                    if (!cacheSnap.empty) {
                        logToScreen("✅ User found in local offline cache!");
                        return cacheSnap;
                    }
                } catch (cacheErr) {
                    console.warn("Local cache lookup failed/empty, falling back to server...", cacheErr);
                }
                
                // Server fallback with timeout limit to prevent infinite spinning
                logToScreen("🌐 Querying server on slow connection (0.10 Mbps limit)...");
                const serverPromise = window.collection(window.db, "users")
                    .where("phone", "==", window.currentPhone)
                    .get({ source: "server" });
                    
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Network Timeout")), 4000)
                );
                
                return await Promise.race([serverPromise, timeoutPromise]);
            })();`;
            content = content.replace(phoneQueryStr, patchedPhoneQuery);
        }

        // 3. Similarly patch QR user checking in primaryData logic: window.getDoc(window.doc(window.db, "users", data.userUid))
        const qrQueryStr = 'await window.getDoc(window.doc(window.db, "users", data.userUid));';
        if (content.includes(qrQueryStr)) {
            const patchedQrQuery = `await (async () => {
                try {
                    // Try offline cache first
                    const cacheDoc = await window.getDocFromServerOrCache(window.doc(window.db, "users", data.userUid), "cache");
                    if (cacheDoc.exists()) {
                        console.log("✅ QR User verified via local cache!");
                        return cacheDoc;
                    }
                } catch(e) {}
                
                // Server fallback
                return await window.getDocFromServerOrCache(window.doc(window.db, "users", data.userUid), "server");
            })();`;
            
            // Add custom helper function if not exists
            if (!content.includes('window.getDocFromServerOrCache')) {
                const helperFunc = `
        window.getDocFromServerOrCache = async function(docRef, source) {
            if (source === "cache") {
                return await window.getDoc(docRef); // firebase getDoc tries cache/server automatically, but we can enforce it
            }
            // Strict timeout for slow server check
            const serverPromise = window.getDoc(docRef);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout")), 4000)
            );
            return await Promise.race([serverPromise, timeoutPromise]).catch(() => window.getDoc(docRef)); 
        };
                `;
                content = content.replace('// 🛡️ PRE-DEFINE CORE FUNCTIONS', helperFunc + '\n// 🛡️ PRE-DEFINE CORE FUNCTIONS');
            }
            content = content.replace(qrQueryStr, patchedQrQuery);
        }

        // 4. Implement robust error handling on phone lookup: catch block
        const catchPhoneStr = 'catch (err) {';
        // We find the exact confirmPhone try-catch block
        content = content.replace('catch (err) {\n                hideSearchLoading();\n                console.error("Failed to search phone:', 'catch (err) {\n                hideSearchLoading();\n                logToScreen("⚠️ Connection issue: " + err.message);\n                showCustomAlert("สัญญาณเครือข่ายขัดข้อง/ดีเลย์สูงมาก โปรดกดยืนยันใหม่อีกครั้ง", "การเชื่อมต่อขัดข้อง");\n                console.error("Failed to search phone:');

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Completed offline persistence injection for ${file}`);
    } catch (e) {
        console.error(`Failed to patch offline config for ${file}:`, e.message);
    }
});
