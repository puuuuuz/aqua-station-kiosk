import fs from 'fs';
const content = fs.readFileSync('admin.html', 'utf8');
const scriptRegex = /<script\b[^>]*>(.*?)<\/script>/gs;
let js = '';
let m;
while ((m = scriptRegex.exec(content)) !== null) { js += m[1] + '\n'; }
const funcRegex = /(?:function\s+([a-zA-Z0-9_]+)\s*\(|window\.([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?function\s*\(|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/g;
let match;
const funcs = new Set();
while ((match = funcRegex.exec(js)) !== null) {
    const name = match[1] || match[2] || match[3];
    if (name) funcs.add(name);
}
const unused = [];
for (let func of funcs) {
    const regex = new RegExp('\\b' + func + '\\b', 'g');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    if (count <= 1) unused.push(func);
}
console.log("Unused in admin.html:");
console.log(unused.join(', '));
