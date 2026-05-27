import fs from 'fs';
const lines = fs.readFileSync('station-v121.html', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('tds')) {
        console.log(`Line ${i+1}: ${lines[i]}`);
    }
}
