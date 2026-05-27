import fs from 'fs';
let content = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

if (!content.includes('cp -r assets www/')) {
    content = content.replace(/cp machine\.png www\/machine\.png 2>\/dev\/null \|\| true/, 'cp machine.png www/machine.png 2>/dev/null || true\n          cp -r assets www/ || true');
    fs.writeFileSync('.github/workflows/build-apk.yml', content, 'utf8');
    console.log("build-apk.yml updated!");
} else {
    console.log("build-apk.yml already copies assets.");
}
