import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const lines = content.split('\n');
let func = '';
let inFunc = false;
for (const line of lines) {
    if (line.includes('function handleStandbyClick')) {
        inFunc = true;
    }
    if (inFunc) {
        func += line + '\n';
        if (line.trim() === '}') break; // this is risky but might work for simple functions
    }
}
console.log(func);
