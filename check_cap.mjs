import fs from 'fs';
try {
  const cap = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
  console.log("capacitor.config.json is valid:", cap);
} catch(e) {
  console.log("INVALID JSON:", e.message);
}
