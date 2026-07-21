const fs = require('fs');

const file = 'www/liff-app.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Replace hardcoded liff.init
    const targetInit = `            try {
                const liffId = "2009501254-Ab3SWZfh";
                await liff.init({ liffId: liffId });`;

    const replaceInit = `            try {
                // Multi-Tenant LIFF: Read areaId from URL or LocalStorage
                const urlParams = new URLSearchParams(window.location.search);
                let targetAreaId = urlParams.get('areaId');
                
                if (targetAreaId) {
                    localStorage.setItem('liff_area_id', targetAreaId);
                } else {
                    targetAreaId = localStorage.getItem('liff_area_id');
                }

                let finalLiffId = "2009501254-Ab3SWZfh"; // Default fallback
                
                if (targetAreaId) {
                    try {
                        const areaDoc = await getDoc(doc(db, "areas", targetAreaId));
                        if (areaDoc.exists()) {
                            const areaData = areaDoc.data();
                            if (areaData.liffId && areaData.liffId.trim() !== "") {
                                finalLiffId = areaData.liffId.trim();
                                console.log("✅ [LIFF] Using Custom LIFF ID for area:", areaData.name);
                            }
                            window.currentLiffAreaId = targetAreaId;
                        }
                    } catch (e) {
                        console.warn("⚠️ [LIFF] Could not load Area LIFF ID, using fallback.", e);
                    }
                }

                await liff.init({ liffId: finalLiffId });`;

    content = content.replace(targetInit, replaceInit);

    // 2. Add areaId to user registration
    const targetReg = `                    lineUid: uid,
                    status: 'pending',`;

    const replaceReg = `                    lineUid: uid,
                    areaId: window.currentLiffAreaId || null,
                    status: 'pending',`;
    
    content = content.replace(targetReg, replaceReg);

    fs.writeFileSync(file, content);
    console.log("✅ Patched www/liff-app.html for Multi-Tenant LIFF.");
} else {
    console.error("File not found:", file);
}
