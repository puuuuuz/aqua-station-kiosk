import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');

const htmlCommentRegex = /<!--([\s\S]*?)-->/g;
let match;
while ((match = htmlCommentRegex.exec(content)) !== null) {
    const lines = match[0].split('\n').length;
    if (lines > 5) {
        console.log(`Large HTML Comment found: ${lines} lines`);
    }
}
