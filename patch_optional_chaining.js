const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    const badCode = "const machineName = document.getElementById('hotlineMachineName')?.innerText || (typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown');";
    const goodCode = `const hotlineEl = document.getElementById('hotlineMachineName');
                const machineName = (hotlineEl && hotlineEl.innerText) ? hotlineEl.innerText : (typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown');`;
                
    if (code.includes(badCode)) {
        code = code.replace(badCode, goodCode);
        fs.writeFileSync(file, code);
        console.log(`Patched optional chaining in ${file}`);
    } else {
        console.log(`Not found in ${file}`);
    }
});
