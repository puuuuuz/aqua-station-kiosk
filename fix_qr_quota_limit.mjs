import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // Locate: window.maxLiters = Math.min(remainingQuota, MAX_DAILY_QUOTA);
        // Replace with: window.maxLiters = Math.min(remainingQuota, allowedQRLimit);
        const oldQrCap = `window.maxLiters = Math.min(remainingQuota, MAX_DAILY_QUOTA);`;
        const newQrCap = `
                                    // 🛡️ DYNAMIC QR HARD CAP: Allows user-specific quota limit (e.g. 192.00L) to pass safely!
                                    window.maxLiters = Math.min(remainingQuota, allowedQRLimit);
        `;
        
        if (content.includes(oldQrCap)) {
            content = content.replace(oldQrCap, newQrCap);
        } else {
            // Also try matching standard syntax if it was spaced differently
            content = content.replace(/window\.maxLiters\s*=\s*Math\.min\(remainingQuota,\s*MAX_DAILY_QUOTA\);/g, `
                                    // 🛡️ DYNAMIC QR HARD CAP: Allows user-specific quota limit (e.g. 192.00L) to pass safely!
                                    window.maxLiters = Math.min(remainingQuota, allowedQRLimit);
            `);
        }

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Corrected QR Quota Limit logic for ${file}`);
    } catch(e) {
        console.error(`Failed to correct QR Quota Limit for ${file}:`, e.message);
    }
});
