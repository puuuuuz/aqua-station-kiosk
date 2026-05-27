import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const syncStr = content.substring(content.indexOf('function initRemoteCommandListener') + 400, content.indexOf('function initRemoteCommandListener') + 1200);
console.log(syncStr);
