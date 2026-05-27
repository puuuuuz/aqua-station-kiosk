import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf8');

content = content.replace(
    /const snap = await window\.collection\(window\.db, "users"\)\.where\("phone", "==", window\.currentPhone\)\.get\(\);/g,
    'const snap = await window.collection(window.db, "users").where("phone", "==", window.currentPhone).limit(1).get();'
);

content = content.replace(
    /const phoneSnap = await window\.collection\(window\.db, "users"\)\.where\("phone", "==", ud\.phone\)\.get\(\);/g,
    'const phoneSnap = await window.collection(window.db, "users").where("phone", "==", ud.phone).limit(1).get();'
);

fs.writeFileSync('station-v121.html', content, 'utf8');
console.log("Added .limit(1) successfully!");
