import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const index = content.indexOf('</body>');
console.log("Index of </body>: ", index);
console.log("Total length: ", content.length);
