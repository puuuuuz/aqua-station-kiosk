import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
console.log(content.slice(-200));
