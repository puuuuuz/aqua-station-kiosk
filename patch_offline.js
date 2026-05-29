const fs = require('fs');
let code = fs.readFileSync('station-v121.html', 'utf8');

// 1. Remove overlay logic from showScreen
const oldShowScreenOverlay = `                    // 2. Overlay Management
                    const overlay = document.getElementById('offlineOverlay');
                    const maint = document.getElementById('maintenanceOverlay');
                    if (overlay) {
                        if (name === 'standby') {
                            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                overlay.classList.add('active');
                                overlay.style.display = 'flex';
                            }
                        } else {
                            overlay.classList.remove('active');
                            overlay.style.display = 'none';
                        }
                    }`;

const newShowScreenOverlay = `                    // 2. Overlay Management
                    const maint = document.getElementById('maintenanceOverlay');
                    // Offline overlay logic removed from showScreen - now purely handled by executeOnlineUI
                    if (typeof window.isAppOnline !== 'undefined') executeOnlineUI(window.isAppOnline);`;

if(code.includes(oldShowScreenOverlay)) {
    code = code.replace(oldShowScreenOverlay, newShowScreenOverlay);
    console.log("Patched showScreen");
} else {
    console.log("Could not find oldShowScreenOverlay");
}

// 2. Fix executeOnlineUI
const oldExecuteOnlineUI = `            if (isOnline) {
                if (dot) dot.style.background = "#10b981"; // Emerald Green
                if (txt) {
                    txt.innerText = "Online";
                    txt.style.color = "white";
                }
                // ✅ ALWAYS HIDE OVERLAY WHEN ONLINE
                if (overlay) {
                    overlay.classList.remove('active');
                    overlay.style.display = 'none';
                }
            } else {
                if (dot) dot.style.background = "#ff4b2b"; // Red
                if (txt) {
                    txt.innerText = "Hardware Offline";
                    txt.style.color = "rgba(255,255,255,0.6)";
                }
                // ⚠️ ONLY SHOW OFFLINE OVERLAY WHEN ON STANDBY SCREEN
                // Otherwise it blocks the QR screen and other screens!
                if (overlay && currentScreenName === 'standby') {
                    overlay.classList.add('active');
                    overlay.style.display = 'flex';
                }
            }`;

const newExecuteOnlineUI = `            const isDispensing = typeof dispenseSession !== 'undefined' && dispenseSession && dispenseSession.active;
            if (isOnline) {
                if (dot) dot.style.background = "#10b981"; // Emerald Green
                if (txt) {
                    txt.innerText = "Online";
                    txt.style.color = "white";
                }
                // ✅ ALWAYS HIDE OVERLAY WHEN ONLINE
                if (overlay) {
                    overlay.classList.remove('active');
                    overlay.style.display = 'none';
                }
            } else {
                if (dot) dot.style.background = "#ff4b2b"; // Red
                if (txt) {
                    txt.innerText = "Hardware Offline";
                    txt.style.color = "rgba(255,255,255,0.6)";
                }
                // ⚠️ STRICT OFFLINE LOCKING: Show on ALL screens unless dispensing
                if (overlay && !isDispensing) {
                    overlay.classList.add('active');
                    overlay.style.display = 'flex';
                }
            }`;

if (code.includes(oldExecuteOnlineUI)) {
    code = code.replace(oldExecuteOnlineUI, newExecuteOnlineUI);
    console.log("Patched executeOnlineUI");
} else {
    console.log("Could not find oldExecuteOnlineUI");
}

// 3. Shorten debounce timer
code = code.replace(
    `offlineDebounceTimer = setTimeout(() => {
                        offlineDebounceTimer = null;
                        executeOnlineUI(false);
                    }, 5000);`,
    `offlineDebounceTimer = setTimeout(() => {
                        offlineDebounceTimer = null;
                        executeOnlineUI(false);
                    }, 2000);`
);

fs.writeFileSync('station-v121.html', code);
