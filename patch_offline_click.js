const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // 1. Initialize window.isAppOnline at the top
    const initTarget = "window.showScreen = function(name) {";
    if (code.includes(initTarget) && !code.includes("window.isAppOnline = navigator.onLine;")) {
        code = code.replace(initTarget, "window.isAppOnline = navigator.onLine;\n        " + initTarget);
    }
    
    // 2. Update window.isAppOnline in updateNetworkStatus
    const netTarget = "console.log(\"🌐 [NETWORK] Actual WAN online status:\", isOnline);";
    if (code.includes(netTarget) && !code.includes("window.isAppOnline = isOnline;")) {
        code = code.replace(netTarget, "window.isAppOnline = isOnline;\n                " + netTarget);
    }
    
    // 3. Block standby click if offline
    const clickTarget = "if (overlay && overlay.classList.contains('active')) return;";
    const clickPatch = `if (overlay && overlay.classList.contains('active')) return;
                    if (window.isAppOnline === false) {
                        console.warn("[UI] Blocked standby click because app is offline");
                        if (typeof updateOnlineUI === 'function') updateOnlineUI(false);
                        return;
                    }`;
    if (code.includes(clickTarget) && !code.includes("window.isAppOnline === false")) {
        code = code.replace(clickTarget, clickPatch);
    }
    
    fs.writeFileSync(file, code);
    console.log(`Patched offline click in ${file}`);
});
