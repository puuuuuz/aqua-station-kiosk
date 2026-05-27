import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf8');

// 1. Remove the malformed firebase-app-compat block
const malformedBlockRegex = /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.8\.1\/firebase-app-compat\.js">([\s\S]*?)<\/script>/;
const malformedMatch = content.match(malformedBlockRegex);
let safetyCode = "";
if (malformedMatch) {
    safetyCode = malformedMatch[1]; // the inner code that was ignored
    content = content.replace(malformedBlockRegex, "");
}

// 2. Remove firebase-firestore-compat
content = content.replace(/<script src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.8\.1\/firebase-firestore-compat\.js"><\/script>\n?/g, "");

// 3. Remove the inline firebase initialization block
// We can locate it by the <script> tag that starts with "// 🚀 INITIALIZE FIREBASE COMPAT"
const initBlockRegex = /<script>\s*\/\/\s*🚀\s*INITIALIZE FIREBASE COMPAT([\s\S]*?)<\/script>\n?/;
const initMatch = content.match(initBlockRegex);
let initCode = "";
if (initMatch) {
    initCode = initMatch[1];
    content = content.replace(initBlockRegex, "");
}

// 4. Construct the new block to put at the end of the body
const newBlock = `
    <!-- Moved Firebase to bottom to prevent render-blocking splash screen hangs -->
    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js"></script>
    <script>
        // Restored Safety Code
        ${safetyCode.trim()}

        // 🚀 INITIALIZE FIREBASE COMPAT
        ${initCode.trim()}
    </script>
</body>
`;

// Insert it right before </body>
content = content.replace(/<\/body>/, newBlock);

fs.writeFileSync('station-v121.html', content, 'utf8');
console.log("station-v121.html patched successfully!");
