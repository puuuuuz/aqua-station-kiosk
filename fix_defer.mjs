import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf8');

content = content.replace(
    /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.8\.1\/firebase-app-compat\.js"><\/script>/,
    '<script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js" defer></script>'
);

content = content.replace(
    /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.8\.1\/firebase-firestore-compat\.js"><\/script>/,
    '<script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js" defer></script>'
);

content = content.replace(
    /<script>\s*\/\/\s*Restored Safety Code/,
    '<script type="module">\n        // Restored Safety Code'
);

fs.writeFileSync('station-v121.html', content, 'utf8');
console.log("station-v121.html patched with defer and type=module successfully!");
