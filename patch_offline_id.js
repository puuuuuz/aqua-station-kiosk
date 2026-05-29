const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // 1. Inject HTML into offlineOverlay
    if (!code.includes('id="offlineMachineIdDisplay"')) {
        code = code.replace(
            '<div class="offline-desc">กำลังตรวจสอบการเชื่อมต่ออินเทอร์เน็ต...</div>',
            '<div class="offline-desc">กำลังตรวจสอบการเชื่อมต่ออินเทอร์เน็ต...</div>\n        <div style="margin-top: 30px; font-size: 24px; color: rgba(255,255,255,0.6); font-family: monospace; font-weight: bold; padding: 10px 20px; background: rgba(0,0,0,0.5); border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">Machine ID: <span id="offlineMachineIdDisplay" style="color: #f1c40f;">Loading...</span></div>'
        );
    }
    
    // 2. Inject JS into executeOnlineUI
    const targetJS = "const overlay = document.getElementById('offlineOverlay');";
    const injectJS = `const overlay = document.getElementById('offlineOverlay');
            const midDisp = document.getElementById('offlineMachineIdDisplay');
            if (midDisp) {
                const machineName = document.getElementById('hotlineMachineName')?.innerText || (typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown');
                midDisp.innerText = machineName;
            }`;
            
    if (!code.includes("const midDisp = document.getElementById('offlineMachineIdDisplay');")) {
        code = code.replace(targetJS, injectJS);
    }
    
    fs.writeFileSync(file, code);
    console.log(`Patched Machine ID display in ${file}`);
});
