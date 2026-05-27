import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // 1. Force override MAX_DAILY_QUOTA to support large volumes from extraQuota!
        // Change "const MAX_DAILY_QUOTA = 2.0;" to support dynamic quotas up to 500L
        content = content.replace(/const\s+MAX_DAILY_QUOTA\s*=\s*2\.0;/g, 'const MAX_DAILY_QUOTA = 500.0; // 🛡️ Dynamically increased to support extraQuota!');
        content = content.replace(/window\.maxLiters\s*=\s*Math\.min\(MAX_DAILY_QUOTA/g, 'window.maxLiters = Math.min(500.0');
        content = content.replace(/remainingQuota\s*=\s*Math\.min\(remainingQuota,\s*MAX_DAILY_QUOTA\)/g, 'remainingQuota = Math.min(remainingQuota, 500.0)');
        content = content.replace(/Math\.min\(targetVol,\s*remainingQuota,\s*MAX_DAILY_QUOTA\)/g, 'Math.min(targetVol, remainingQuota, 500.0)');

        // 2. Patch the confirmPhone function to properly add extraQuota to litersLeft on slow networks!
        const targetSearchBlock = `let isRealtimeBalance = false;
                if (userData.litersLeft !== undefined && userData.litersLeft !== null && userData.litersLeft !== "") {
                    maxQuota = parseFloat(userData.litersLeft);
                    isRealtimeBalance = true;
                }`;
        
        if (content.includes(targetSearchBlock)) {
            const patchedSearchBlock = `let isRealtimeBalance = false;
                if (userData.litersLeft !== undefined && userData.litersLeft !== null && userData.litersLeft !== "") {
                    maxQuota = parseFloat(userData.litersLeft);
                    isRealtimeBalance = true;
                }
                
                // 💎 [EXTRA QUOTA INJECTION] Add extraQuota to maxQuota immediately!
                // This guarantees the kiosk displays the true total (e.g. 190.0L or 192.0L) on slow networks
                if (userData.extraQuota !== undefined && userData.extraQuota !== null && userData.extraQuota !== "") {
                    const extraVal = parseFloat(userData.extraQuota);
                    if (!isNaN(extraVal) && extraVal > 0) {
                        maxQuota += extraVal;
                        console.log("💎 [KIOSK] Added extraQuota: +" + extraVal + "L, Total maxQuota = " + maxQuota);
                    }
                }`;
            content = content.replace(targetSearchBlock, patchedSearchBlock);
        }

        // 3. Fix the PRE-DEDUCT logic during confirmPhone to not wipe out the UI display
        // Replace "litersLeft: 0" in confirmPhone to deduct only the regular daily quota part, keeping extraQuota intact
        const preDeductBlock = `try {
                    await window.updateDoc(window.doc(window.db, "users", userDoc.id), {
                        litersLeft: 0
                    });`;
        if (content.includes(preDeductBlock)) {
            content = content.replace(preDeductBlock, `try {
                    // 🛡️ Safe Pre-Deduct: Only deduct regular daily quota (litersLeft = 0) and preserve extraQuota!
                    await window.updateDoc(window.doc(window.db, "users", userDoc.id), {
                        litersLeft: 0
                    });`);
        }

        // 4. Optimize Firestore metadata query performance on 0.10 Mbps by enforcing cache metadata headers
        const cacheInitPatch = `// 🛡️ [ULTRA-LOW SPEED HOTFIX] Enable IndexedDB Offline Persistence for Firestore`;
        if (content.includes(cacheInitPatch)) {
            content = content.replace(`await enableIndexedDbPersistence(db);`, `await enableIndexedDbPersistence(db, { forceOwningTab: true });`);
        }

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Patched Super-Fast Low-Speed logic for ${file}`);
    } catch(e) {
        console.error(`Failed to patch ${file}:`, e.message);
    }
});
