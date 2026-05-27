import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let hasError = false;
while ((match = scriptRegex.exec(content)) !== null) {
    const code = match[1];
    if (code.trim() === '') continue;
    try {
        new Function(code);
    } catch (e) {
        console.error("Syntax Error found!");
        console.error(e.message);
        hasError = true;
    }
}
if (!hasError) {
    console.log("Syntax check complete. No errors.");
}
