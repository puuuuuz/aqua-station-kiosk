import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // 1. Inject a global watchdog in the head/top script that unlocks the black screen after 2.5 seconds regardless of network status!
        const bodyTag = '<body class="bg-gray-900 text-white font-sans overflow-hidden select-none">';
        if (content.includes(bodyTag)) {
            const patchedBody = bodyTag + `
    <!-- 🛡️ [BLACK-SCREEN SAFETY NET] Automatically force show standby screen and disable loader if blocked for > 2.5 seconds! -->
    <script>
        setTimeout(() => {
            const loader = document.getElementById('appLoader');
            const startupScreen = document.getElementById('startupScreen');
            if ((loader && loader.style.display !== 'none') || (startupScreen && startupScreen.style.display !== 'none')) {
                console.warn("⚠️ [WATCHDOG] Firebase connection took too long on 0.10 Mbps! Bypassing black screen to prevent app crash.");
                if (loader) { loader.style.display = 'none'; loader.classList.remove('active'); }
                if (startupScreen) { startupScreen.style.display = 'none'; startupScreen.classList.remove('active'); }
                
                // Force display main kiosk container
                const container = document.getElementById('kioskContainer') || document.querySelector('.kiosk-container');
                if (container) { container.style.opacity = '1'; container.style.display = 'block'; }
                
                if (typeof showScreen === 'function') {
                    showScreen('standby');
                }
            }
        }, 2500);
    </script>`;
            content = content.replace(bodyTag, patchedBody);
        }

        // 2. Wrap Firebase listeners (listenToConfig) with a 3-second safety timeout so slow/stuck listeners don't hang the app!
        const listenToConfigStr = 'function listenToConfig() {';
        if (content.includes(listenToConfigStr)) {
            const patchedListenToConfig = `function listenToConfig() {
            // 🛡️ [LOW-SPEED SAFETY NET] Prevent Firebase listener from locking up the application boot on slow 0.10 Mbps connection!
            let listenerResolved = false;
            setTimeout(() => {
                if (!listenerResolved) {
                    console.warn("⚠️ [LISTEN-WATCHDOG] Config listener took too long. Forcing app to unlock!");
                    hideAppLoader();
                    showScreen('standby');
                }
            }, 3000);`;
            content = content.replace(listenToConfigStr, patchedListenToConfig);
        }

        // 3. Mark listener as resolved inside both snapshots
        const machinesSnapshotStr = 'onSnapshot(doc(db, "machines", DEVICE_ID), (snap) => {';
        if (content.includes(machinesSnapshotStr)) {
            content = content.replace(machinesSnapshotStr, `onSnapshot(doc(db, "machines", DEVICE_ID), (snap) => {
                listenerResolved = true; // Unlock watchdog`);
        }

        writeFileSync(file, content, 'utf8');
        console.log(`✅ Patched Black Screen Watchdog for ${file}`);
    } catch(e) {
        console.error(`Failed to patch Black Screen Watchdog for ${file}:`, e.message);
    }
});
