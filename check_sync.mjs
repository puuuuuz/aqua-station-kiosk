import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const syncStr = content.substring(content.indexOf('function syncIdToUI'), content.indexOf('function syncIdToUI') + 1000);
console.log(syncStr);
