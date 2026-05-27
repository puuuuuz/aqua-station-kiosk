import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const links = content.match(/<link[^>]+>/g);
console.log("Link tags: ", links);
