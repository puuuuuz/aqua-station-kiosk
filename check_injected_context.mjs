import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const index = content.indexOf('firebase-app-compat.js');
console.log(content.substring(index - 100, index + 200));
