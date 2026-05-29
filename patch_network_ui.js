const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    const target = 'console.log("🌐 [NETWORK] Actual WAN online status:", isOnline);';
    const fix = `console.log("🌐 [NETWORK] Actual WAN online status:", isOnline);
                if (typeof updateOnlineUI === 'function') updateOnlineUI(isOnline);`;
                
    if (code.includes(target) && !code.includes("updateOnlineUI(isOnline)")) {
        code = code.replace(target, fix);
        fs.writeFileSync(file, code);
        console.log(`Patched network UI in ${file}`);
    } else {
        console.log(`Not found or already patched in ${file}`);
    }
});
