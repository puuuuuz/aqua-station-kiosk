import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const lines = content.split('\n');
let func = '';
let inFunc = false;
let braceCount = 0;
for (const line of lines) {
    if (line.includes("document.addEventListener('DOMContentLoaded', () => {")) {
        inFunc = true;
    }
    if (inFunc) {
        func += line + '\n';
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        if (braceCount === 0 && func.includes('{')) {
            break;
        }
    }
}
// just print the first 50 lines to see if it's intact
console.log(func.split('\n').slice(0, 50).join('\n'));
