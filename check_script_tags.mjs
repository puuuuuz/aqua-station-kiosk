import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');

const index = content.indexOf('// Restored Safety Code');
const block = content.substring(index, content.indexOf('</body>'));
const count = (block.match(/<\/script>/g) || []).length;
console.log("Number of </script> tags in the injected block: ", count);
