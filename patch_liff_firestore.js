const fs = require('fs');
let code = fs.readFileSync('liff-app.html', 'utf8');

// Replace getFirestore with initializeFirestore
code = code.replace(
    'import { getFirestore, doc,',
    'import { getFirestore, initializeFirestore, doc,'
);

const oldInit = 'const db = getFirestore(app);';
const newInit = `const db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
            experimentalForceLongPolling: true
        });`;

if (code.includes(oldInit)) {
    code = code.replace(oldInit, newInit);
    fs.writeFileSync('liff-app.html', code);
    console.log("Patched liff-app.html with experimentalForceLongPolling");
} else {
    console.log("Could not find oldInit in liff-app.html");
}
