const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // 1. Add z-index to offlineOverlay
    const oldCSS = `#offlineOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            display: none;
            flex-direction: column;`;
    const newCSS = `#offlineOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            display: none;
            flex-direction: column;
            z-index: 999999999;`;
    if (code.includes(oldCSS)) code = code.replace(oldCSS, newCSS);

    // 2. Remove manual manipulation of offlineOverlay in showScreen
    const badCode = `                    if (overlay) {
                        if (name === 'standby') {
                            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                overlay.classList.add('active');
                                overlay.style.display = 'flex';
                            } else {
                                // If we're supposedly online, let the normal flow decide, but aggressively hide to prevent stuck states
                                overlay.classList.remove('active');
                                overlay.style.display = 'none';
                            }
                        }
                    }`;
    if (code.includes(badCode)) {
        code = code.replace(badCode, `// Removed manual offlineOverlay manipulation from showScreen`);
    }

    // 3. Make window.isAppOnline default to false instead of navigator.onLine
    code = code.replace("window.isAppOnline = navigator.onLine;", "window.isAppOnline = false;");
    
    // 4. In checkRealInternet, remove navigator.onLine check completely so it always pings!
    const oldCheck = `            async function checkRealInternet() {
                if (!navigator.onLine) return false;`;
    const newCheck = `            async function checkRealInternet() {`;
    if (code.includes(oldCheck)) code = code.replace(oldCheck, newCheck);
    
    fs.writeFileSync(file, code);
    console.log(`Patched offline bug in ${file}`);
});
