const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    const badCode = "window.increment = (n) => firebase.firestore.FieldValue.increment(n);";
    const goodCode = "window.increment = (n) => firebase.firestore.FieldValue.increment(n);\n            window.deleteField = () => firebase.firestore.FieldValue.delete();";
                
    if (code.includes(badCode) && !code.includes("window.deleteField =")) {
        code = code.replace(badCode, goodCode);
        fs.writeFileSync(file, code);
        console.log(`Patched deleteField in ${file}`);
    } else {
        console.log(`Not found or already patched in ${file}`);
    }
});
