import fs from 'fs';
const lines = fs.readFileSync('station-v121.html', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('tds')) {
        let start = Math.max(0, i - 10);
        let end = Math.min(lines.length, i + 10);
        console.log(`--- Line ${i+1} Context ---`);
        console.log(lines.slice(start, end).join('\n'));
        console.log('---------------------------');
    }
}
