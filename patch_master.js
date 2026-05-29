const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // 1. Update updateOnlineUI
    const oldUpdateUI = `        function updateOnlineUI(isOnline) {
            if (isOnline) {
                if (offlineDebounceTimer) { clearTimeout(offlineDebounceTimer); offlineDebounceTimer = null; }
            } else {
                if (!offlineDebounceTimer) {
                    offlineDebounceTimer = setTimeout(() => {
                        offlineDebounceTimer = null;
                        executeOnlineUI(false);
                    }, 5000);
                }
                return; // Delay the offline UI by 5 seconds
            }
            executeOnlineUI(true);
        }`;
    const newUpdateUI = `        function updateOnlineUI(isOnline, forceInstant = false) {
            if (isOnline) {
                if (offlineDebounceTimer) { clearTimeout(offlineDebounceTimer); offlineDebounceTimer = null; }
                executeOnlineUI(true);
            } else {
                if (forceInstant) {
                    if (offlineDebounceTimer) { clearTimeout(offlineDebounceTimer); offlineDebounceTimer = null; }
                    executeOnlineUI(false);
                    return;
                }
                if (!offlineDebounceTimer) {
                    offlineDebounceTimer = setTimeout(() => {
                        offlineDebounceTimer = null;
                        executeOnlineUI(false);
                    }, 5000);
                }
            }
        }`;
    if (code.includes(oldUpdateUI)) {
        code = code.replace(oldUpdateUI, newUpdateUI);
    }

    // 2. Remove updateOnlineUI from Firebase
    code = code.replace(/updateOnlineUI\(true\);/g, '// updateOnlineUI(true); removed from Firebase');
    code = code.replace(/updateOnlineUI\(false\);/g, '// updateOnlineUI(false); removed from Firebase');

    // 3. Graceful Dispense Exception in executeOnlineUI
    const oldExecuteUI = `        function executeOnlineUI(isOnline) {
            const dot = document.getElementById('hwStatusDot');`;
    const newExecuteUI = `        function executeOnlineUI(isOnline) {
            if (!isOnline && typeof dispenseSession !== 'undefined' && dispenseSession && dispenseSession.active) {
                console.warn("[NETWORK] Offline detected, but user is dispensing. Suppressing offline overlay.");
                return;
            }
            const dot = document.getElementById('hwStatusDot');`;
    if (code.includes(oldExecuteUI)) {
        code = code.replace(oldExecuteUI, newExecuteUI);
    }

    // 4. Centralized Network Manager & Boot Lock
    const oldNetUpdate = `async function updateNetworkStatus() {`;
    const newNetUpdate = `async function updateNetworkStatus(forceInstant = false) {`;
    if (code.includes(oldNetUpdate)) {
        code = code.replace(oldNetUpdate, newNetUpdate);
    }

    const oldNetCall = `if (typeof updateOnlineUI === 'function') updateOnlineUI(isOnline);`;
    const newNetCall = `if (typeof updateOnlineUI === 'function') updateOnlineUI(isOnline, forceInstant);`;
    if (code.includes(oldNetCall)) {
        code = code.replace(oldNetCall, newNetCall);
    }

    const oldInitialCheck = `updateNetworkStatus(); // Initial check`;
    const newInitialCheck = `if (!navigator.onLine && typeof updateOnlineUI === 'function') updateOnlineUI(false, true);
            updateNetworkStatus(true); // Initial check`;
    if (code.includes(oldInitialCheck)) {
        code = code.replace(oldInitialCheck, newInitialCheck);
    }

    fs.writeFileSync(file, code);
    console.log(`Patched offline handling in ${file}`);
});
