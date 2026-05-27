import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const start = content.indexOf('// 🚀 DYNAMIC FIREBASE LOADER');
const end = content.indexOf('</script>', start) + 9;
console.log(content.substring(start, end));
