const fs = require('fs');
let code = fs.readFileSync('liff-app.html', 'utf8');

const oldCode = `                console.log("✅ [Register] Success! Moving to dashboard...");
                await new Promise(r => setTimeout(r, 1000));
                loadingOverlay.classList.remove('show');
                showScreen('dashboard');`;

const newCode = `                console.log("✅ [Register] Success! Moving to dashboard...");
                await new Promise(r => setTimeout(r, 1000));
                loadingOverlay.classList.remove('show');
                window.location.reload();`;

if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    fs.writeFileSync('liff-app.html', code);
    console.log("Patched liff-app.html successfully (added reload after register)");
} else {
    console.log("Could not find old code in liff-app.html");
}
