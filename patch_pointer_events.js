const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace pointer-events: all with pointer-events: auto
    code = code.replace(/pointer-events:\s*all;/g, "pointer-events: auto;");
    
    fs.writeFileSync(file, code);
    console.log(`Patched pointer-events in ${file}`);
});
