import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // Replace the call to hideAppLoader() which is undefined and crashes the script,
        // with the proper DOM hide code that we defined in the body watchdog!
        const badCall = 'hideAppLoader();';
        const goodCall = `
                    // 🛡️ Fix undefined function crash: hide loader and show standby screen
                    const loaderEl = document.getElementById('appLoader') || document.getElementById('startupScreen') || document.querySelector('.app-loader');
                    if (loaderEl) {
                        loaderEl.style.display = 'none';
                        loaderEl.classList.remove('active');
                    }
                    const containerEl = document.getElementById('kioskContainer') || document.querySelector('.kiosk-container');
                    if (containerEl) {
                        containerEl.style.opacity = '1';
                        containerEl.style.display = 'block';
                    }
        `;
        
        if (content.includes(badCall)) {
            content = content.replace(badCall, goodCall);
            console.log(`✅ Replaced crash-inducing hideAppLoader() call in ${file}`);
        }

        writeFileSync(file, content, 'utf8');
    } catch(e) {
        console.error(`Failed to patch undefined crash in ${file}:`, e.message);
    }
});
