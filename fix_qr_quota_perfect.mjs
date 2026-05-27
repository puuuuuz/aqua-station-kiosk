import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // Locate: window.maxLiters = Math.min(remainingQuota, MAX_DAILY_QUOTA);
        // Under the QR confirmation section in station-v121.html
        // We will safely replace this single line to allow extraQuota!
        // To make sure it has 'primaryData.extraQuota' resolved from the cross-referenced account:
        
        const oldQrCap = `window.maxLiters = Math.min(remainingQuota, MAX_DAILY_QUOTA);`;
        
        const newQrCap = `
                                    // 🛡️ DYNAMIC QR HARD CAP (SAFE ROLLBACK BASE):
                                    // Allows user-specific quota limit (e.g. 192.00L) to pass safely!
                                    let allowedQRLimit = 2.0;
                                    if (primaryData.extraQuota !== undefined && primaryData.extraQuota !== null && primaryData.extraQuota !== "") {
                                        const extraVal = parseFloat(primaryData.extraQuota);
                                        if (!isNaN(extraVal) && extraVal > 0) {
                                            allowedQRLimit = 2.0 + extraVal; // 192.0L
                                        }
                                    }
                                    window.maxLiters = Math.min(remainingQuota, allowedQRLimit);
        `;
        
        if (content.includes(oldQrCap)) {
            content = content.replace(oldQrCap, newQrCap);
        } else {
            content = content.replace(/window\.maxLiters\s*=\s*Math\.min\(remainingQuota,\s*MAX_DAILY_QUOTA\);/g, newQrCap);
        }

        // Also adjust remainingQuota limit check to dynamic allowedQRLimit
        const oldQrConfirmCap = `remainingQuota = Math.min(remainingQuota, MAX_DAILY_QUOTA);`;
        const newQrConfirmCap = `
                                    let allowedQRLimit = 2.0;
                                    if (primaryData.extraQuota !== undefined && primaryData.extraQuota !== null && primaryData.extraQuota !== "") {
                                        const extraVal = parseFloat(primaryData.extraQuota);
                                        if (!isNaN(extraVal) && extraVal > 0) {
                                            allowedQRLimit = 2.0 + extraVal;
                                        }
                                    }
                                    remainingQuota = Math.min(remainingQuota, allowedQRLimit);
        `;
        
        if (content.includes(oldQrConfirmCap)) {
            content = content.replace(oldQrConfirmCap, newQrConfirmCap);
        } else {
            content = content.replace(/remainingQuota\s*=\s*Math\.min\(remainingQuota,\s*MAX_DAILY_QUOTA\);/g, newQrConfirmCap);
        }

        // Also adjust the final dispense calculation to dynamicallowedQRLimit
        const oldDispenseCap = `const finalDispenseVol = Math.min(targetVol, remainingQuota, MAX_DAILY_QUOTA);`;
        const newDispenseCap = `
                                    let allowedQRLimit = 2.0;
                                    if (primaryData.extraQuota !== undefined && primaryData.extraQuota !== null && primaryData.extraQuota !== "") {
                                        const extraVal = parseFloat(primaryData.extraQuota);
                                        if (!isNaN(extraVal) && extraVal > 0) {
                                            allowedQRLimit = 2.0 + extraVal;
                                        }
                                    }
                                    const finalDispenseVol = Math.min(targetVol, remainingQuota, allowedQRLimit);
        `;
        if (content.includes(oldDispenseCap)) {
            content = content.replace(oldDispenseCap, newDispenseCap);
        } else {
            content = content.replace(/const\s+finalDispenseVol\s*=\s*Math\.min\(targetVol,\s*remainingQuota,\s*MAX_DAILY_QUOTA\);/g, newDispenseCap);
        }

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Perfectly patched QR Quota dynamically for ${file}`);
    } catch(e) {
        console.error(`Failed to patch QR for ${file}:`, e.message);
    }
});
