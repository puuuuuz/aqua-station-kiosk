const fs = require('fs');
let code = fs.readFileSync('station-v121.html', 'utf8');

// 1. Fix offlineMachineIdDisplay logic
const oldClickLogic = `            const midDisp = document.getElementById('offlineMachineIdDisplay');
            if (midDisp) {
                const hotlineEl = document.getElementById('hotlineMachineName');
                const machineName = (hotlineEl && hotlineEl.innerText) ? hotlineEl.innerText : (typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown');
                midDisp.innerText = machineName;
            }`;
code = code.replace(oldClickLogic, '');

const oldExecuteOnlineUI = `                // ⚠️ STRICT OFFLINE LOCKING: Show on ALL screens unless dispensing
                if (overlay && !isDispensing) {
                    overlay.classList.add('active');
                    overlay.style.display = 'flex';
                }`;
const newExecuteOnlineUI = `                // ⚠️ STRICT OFFLINE LOCKING: Show on ALL screens unless dispensing
                if (overlay && !isDispensing) {
                    overlay.classList.add('active');
                    overlay.style.display = 'flex';
                    
                    const midDisp = document.getElementById('offlineMachineIdDisplay');
                    if (midDisp) {
                        const hotlineEl = document.getElementById('hotlineMachineName');
                        let machineName = (hotlineEl && hotlineEl.innerText && hotlineEl.innerText !== '...') ? hotlineEl.innerText : (localStorage.getItem('DEVICE_ID_OVERRIDE') || (typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown'));
                        midDisp.innerText = machineName;
                    }
                }`;
if (code.includes(oldExecuteOnlineUI)) {
    code = code.replace(oldExecuteOnlineUI, newExecuteOnlineUI);
    console.log("Patched executeOnlineUI with ID display");
} else {
    console.log("Could not find oldExecuteOnlineUI");
}

// 2. Fix checkRealInternet to use fetch no-cors
const oldCheckInternet = `            async function checkRealInternet() {
                return new Promise((resolve) => {
                    const img = new Image();
                    const timeoutId = setTimeout(() => {
                        img.src = '';
                        resolve(false);
                    }, 2500);
                    img.onload = () => {
                        clearTimeout(timeoutId);
                        resolve(true);
                    };
                    img.onerror = () => {
                        clearTimeout(timeoutId);
                        resolve(false);
                    };
                    img.src = 'https://www.google.com/favicon.ico?cb=' + Date.now();
                });
            }`;
const newCheckInternet = `            async function checkRealInternet() {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for slow networks
                    
                    await fetch('https://www.google.com/favicon.ico?cb=' + Date.now(), { 
                        mode: 'no-cors',
                        cache: 'no-store',
                        signal: controller.signal 
                    });
                    
                    clearTimeout(timeoutId);
                    return true;
                } catch (e) {
                    console.warn("[NETWORK] Internet check failed:", e.message);
                    return false;
                }
            }`;
if (code.includes(oldCheckInternet)) {
    code = code.replace(oldCheckInternet, newCheckInternet);
    console.log("Patched checkRealInternet with fetch API");
} else {
    console.log("Could not find oldCheckInternet");
}

fs.writeFileSync('station-v121.html', code);
