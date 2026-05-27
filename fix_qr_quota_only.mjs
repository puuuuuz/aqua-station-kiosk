import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // Locate: remainingQuota = Math.min(remainingQuota, MAX_DAILY_QUOTA);
        // This is where QR Code caps the user to 2.0L.
        // We will dynamically adjust allowedQRLimit inside QR just like confirmPhone does, 
        // without touching any boot scripts, listeners, or IndexedDB configurations!
        
        const oldQrCapBlock = `remainingQuota = Math.min(remainingQuota, MAX_DAILY_QUOTA);
                                    console.log(\`✅ [QR CONFIRMED] Target: \${targetVol}L | Remaining: \${remainingQuota}L (cap: \${MAX_DAILY_QUOTA}L)\`);`;

        const newQrCapBlock = `
                                    // 🛡️ DYNAMIC HARD CAP FOR QR CODE (QUOTA + EXTRA QUOTA):
                                    // Strictly caps regular users at 2.0L, but safely unlocks total capacity for special accounts!
                                    let allowedQRLimit = 2.0;
                                    if (primaryData.extraQuota !== undefined && primaryData.extraQuota !== null && primaryData.extraQuota !== "") {
                                        const extraVal = parseFloat(primaryData.extraQuota);
                                        if (!isNaN(extraVal) && extraVal > 0) {
                                            allowedQRLimit = 2.0 + extraVal; // E.g. 192.00L
                                        }
                                    }
                                    remainingQuota = Math.min(remainingQuota, allowedQRLimit);
                                    console.log(\`✅ [QR CONFIRMED] Target: \${targetVol}L | Remaining: \${remainingQuota}L (cap: \${allowedQRLimit}L)\`);`;

        if (content.includes(oldQrCapBlock)) {
            content = content.replace(oldQrCapBlock, newQrCapBlock);
        } else {
            // Regexp fallback in case whitespace differs
            content = content.replace(/remainingQuota\s*=\s*Math\.min\(remainingQuota,\s*MAX_DAILY_QUOTA\);/g, `
                                    let allowedQRLimit = 2.0;
                                    if (primaryData.extraQuota !== undefined && primaryData.extraQuota !== null && primaryData.extraQuota !== "") {
                                        const extraVal = parseFloat(primaryData.extraQuota);
                                        if (!isNaN(extraVal) && extraVal > 0) {
                                            allowedQRLimit = 2.0 + extraVal;
                                        }
                                    }
                                    remainingQuota = Math.min(remainingQuota, allowedQRLimit);
            `);
        }

        // Also update: const finalDispenseVol = Math.min(targetVol, remainingQuota, MAX_DAILY_QUOTA); in QR to allowedQRLimit
        content = content.replace(/Math\.min\(targetVol,\s*remainingQuota,\s*MAX_DAILY_QUOTA\)/g, `Math.min(targetVol, remainingQuota, (primaryData.extraQuota ? (2.0 + parseFloat(primaryData.extraQuota)) : 2.0))`);
        // Also update: window.maxLiters = Math.min(remainingQuota, MAX_DAILY_QUOTA); in QR to allowedQRLimit
        content = content.replace(/window\.maxLiters\s*=\s*Math\.min\(remainingQuota,\s*MAX_DAILY_QUOTA\);/g, `window.maxLiters = Math.min(remainingQuota, (primaryData.extraQuota ? (2.0 + parseFloat(primaryData.extraQuota)) : 2.0));`);

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Patched QR Code Quota Override safely in ${file}`);
    } catch(e) {
        console.error(`Failed to patch QR Quota for ${file}:`, e.message);
    }
});
