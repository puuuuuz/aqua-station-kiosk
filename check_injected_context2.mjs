import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const index = content.indexOf('firebase.initializeApp(firebaseConfig);');
console.log(content.substring(index - 50, index + 350));
