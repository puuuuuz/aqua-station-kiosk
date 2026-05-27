import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // Locate: let primaryData = ud;
        // Make sure we resolve the cross-reference phone account via cached/server properly, 
        // and safely merge the litersLeft and extraQuota fields inside QR to avoid the "0 Liters" bug!
        
        const oldCrossBlock = `// Check for cross-referenced phone account first!
                                            let primaryData = ud;
                                            if (ud.phone) {
                                                const phoneSnap = await window.collection(window.db, "users").where("phone", "==", ud.phone).get();
                                                if (!phoneSnap.empty) {
                                                    primaryData = phoneSnap.docs[0].data();
                                                }
                                            }`;
                                            
        const newCrossBlock = `// Check for cross-referenced phone account first!
                                            let primaryData = ud;
                                            if (ud.phone) {
                                                try {
                                                    // Query via local cache first for instant response, fall back to server
                                                    const phoneSnap = await window.collection(window.db, "users")
                                                        .where("phone", "==", ud.phone)
                                                        .get({ source: "cache" })
                                                        .catch(() => window.collection(window.db, "users").where("phone", "==", ud.phone).get());
                                                        
                                                    if (!phoneSnap.empty) {
                                                        primaryData = phoneSnap.docs[0].data();
                                                        console.log("✅ Cross-referenced account loaded successfully:", primaryData.fullName || primaryData.displayName);
                                                    }
                                                } catch(err) {
                                                    console.warn("Failed to cross-reference phone account, using default LINE profile data:", err);
                                                }
                                            }

                                            // 🛡️ [NEW] GUARANTEE VALUES IN primaryData
                                            if (primaryData.litersLeft === undefined || primaryData.litersLeft === null) {
                                                primaryData.litersLeft = parseFloat(primaryData.quota ?? 2.0);
                                            }
                                            if (primaryData.extraQuota === undefined || primaryData.extraQuota === null) {
                                                primaryData.extraQuota = 0;
                                            }`;

        if (content.includes(oldCrossBlock)) {
            content = content.replace(oldCrossBlock, newCrossBlock);
        } else {
            // Regexp fallback in case whitespace differs
            content = content.replace(/\/\/ Check for cross-referenced phone account first![\s\S]+?primaryData = phoneSnap\.docs\[0\]\.data\(\);\s*\}\s*\}/, newCrossBlock);
        }

        // Also verify allowedQRLimit definition inside QR to make sure it reads from primaryData
        content = content.replace(/let allowedQRLimit = 2\.0;\s*if \(primaryData\.extraQuota !== undefined[\s\S]+?\}\s*\}\s*remainingQuota = Math\.min\(remainingQuota, allowedQRLimit\);/g, `
                                    let allowedQRLimit = 2.0;
                                    const extraVal = parseFloat(primaryData.extraQuota || 0);
                                    if (!isNaN(extraVal) && extraVal > 0) {
                                        allowedQRLimit = 2.0 + extraVal;
                                    }
                                    remainingQuota = Math.min(remainingQuota, allowedQRLimit);
        `);

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Patched QR Zero Display bug in ${file}`);
    } catch(e) {
        console.error(`Failed to patch QR Zero Display for ${file}:`, e.message);
    }
});
