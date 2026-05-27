import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const index = content.indexOf('firebase-app-compat.js');
console.log("Index of firebase-app-compat.js: ", index);
