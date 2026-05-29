const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    const oldCheck = `            async function checkRealInternet() {
                if (!navigator.onLine) return false;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2500);
                    await fetch('https://clients3.google.com/generate_204', { 
                        mode: 'no-cors', 
                        signal: controller.signal,
                        cache: 'no-store'
                    });
                    clearTimeout(timeoutId);
                    return true;
                } catch (e) {
                    return false;
                }
            }`;
            
    const newCheck = `            async function checkRealInternet() {
                if (!navigator.onLine) return false;
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

    if (code.includes(oldCheck)) {
        code = code.replace(oldCheck, newCheck);
        fs.writeFileSync(file, code);
        console.log(`Patched checkRealInternet in ${file}`);
    } else {
        console.log(`Could not find old checkRealInternet in ${file}`);
    }
});
