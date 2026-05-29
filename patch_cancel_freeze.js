const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // 1. Move unsubscribe to the top of showScreen to prevent race condition
    const showScreenStart = "async function showScreen(name) {\n                    console.log('🎬 [UI] showScreen:', name);";
    const killListenerCode = `async function showScreen(name) {
                    console.log('🎬 [UI] showScreen:', name);
                    if (name === 'standby' || name === 'choice' || name === 'thankyou') {
                        if (window._sessionUnsubscribe) {
                            try { window._sessionUnsubscribe(); } catch(e){}
                            window._sessionUnsubscribe = null;
                        }
                    }`;
    if (code.includes(showScreenStart) && !code.includes("Kill listener immediately")) {
        code = code.replace(showScreenStart, killListenerCode);
    }
    
    // 2. Fix line 583 listener so it starts the countdown
    const listenerTarget = "if (snap && snap.exists && snap.data().status === 'finished') window.showScreen('thankyou');";
    const listenerFix = `if (snap && snap.exists && snap.data().status === 'finished') {
                        window.showScreen('thankyou');
                        if (typeof startResetCountdown === 'function') startResetCountdown();
                    }`;
    if (code.includes(listenerTarget)) {
        code = code.replace(listenerTarget, listenerFix);
    }
    
    fs.writeFileSync(file, code);
    console.log(`Patched cancel freeze in ${file}`);
});
