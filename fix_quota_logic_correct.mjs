import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // 1. Restore MAX_DAILY_QUOTA to 2.0L for regular safety cap!
        content = content.replace(/const MAX_DAILY_QUOTA = 500\.0;[^*\n]*/g, 'const MAX_DAILY_QUOTA = 2.0; // 🛡️ Regular users strictly capped at 2.0L!');

        // 2. Patched Kiosk Display and Dispensing flow:
        // We will calculate 'allowedMaxLimit' dynamically per user:
        // Regular user = Math.min(2.0, litersLeft)
        // Special user with extraQuota = litersLeft + extraQuota (which bypasses the 2.0L hard cap safely!)
        
        // Let's replace the confirmPhone window.maxLiters calculation logic:
        const oldMaxLitersCalc = `window.maxLiters = Math.min(500.0, isRealtimeBalance ? Math.max(0, maxQuota) : Math.max(0, maxQuota - actualUsedToday));`;
        const newMaxLitersCalc = `
                // 🛡️ DYNAMIC HARD CAP PER USER:
                // Regular users are strictly capped at 2.0L.
                // Users with extraQuota can unlock up to the combined sum of (litersLeft + extraQuota).
                let allowedLimit = 2.0; 
                if (userData.extraQuota !== undefined && userData.extraQuota !== null && userData.extraQuota !== "") {
                    const extraVal = parseFloat(userData.extraQuota);
                    if (!isNaN(extraVal) && extraVal > 0) {
                        allowedLimit = 2.0 + extraVal; // Unlock specifically for this user
                    }
                }
                
                window.maxLiters = Math.min(allowedLimit, isRealtimeBalance ? Math.max(0, maxQuota) : Math.max(0, maxQuota - actualUsedToday));
        `;
        content = content.replace(oldMaxLitersCalc, newMaxLitersCalc);

        // 3. Similarly adjust QR confirmation cap in station-v121.html
        // We look for remainingQuota = Math.min(remainingQuota, 500.0);
        const qrLimitCalc = `remainingQuota = Math.min(remainingQuota, 500.0);`;
        const qrNewLimitCalc = `
                                    // 🛡️ DYNAMIC HARD CAP FOR QR CODE:
                                    let allowedQRLimit = 2.0;
                                    if (primaryData.extraQuota !== undefined && primaryData.extraQuota !== null && primaryData.extraQuota !== "") {
                                        const extraVal = parseFloat(primaryData.extraQuota);
                                        if (!isNaN(extraVal) && extraVal > 0) {
                                            allowedQRLimit = 2.0 + extraVal;
                                        }
                                    }
                                    remainingQuota = Math.min(remainingQuota, allowedQRLimit);
        `;
        content = content.replace(qrLimitCalc, qrNewLimitCalc);

        // 4. Adjust the Math.min(targetVol, remainingQuota, 500.0) in QR
        content = content.replace(/Math\.min\(targetVol,\s*remainingQuota,\s*500\.0\)/g, 'Math.min(targetVol, remainingQuota, allowedQRLimit)');

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Corrected quota safety caps for ${file}`);
    } catch(e) {
        console.error(`Failed to correct quota safety caps for ${file}:`, e.message);
    }
});
