import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const matches = content.match(/<\/body>/g);
console.log("Matches of </body>: ", matches ? matches.length : 0);
