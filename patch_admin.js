const fs = require('fs');
const files = ['admin.html', 'admin_full.html', 'admin_recovered.html'];

const searchStr = '<div id="tab-tech" class="settings-tab">';
const injectStr = '<div id="tab-tech" class="settings-tab">\n                    <!-- CRON LOG -->\n                    <div style="background:#e8f5e9; border:1px solid #2ecc71; padding:15px; border-radius:15px; margin-bottom:20px; display:flex; align-items:center; gap:10px;">\n                        <div style="font-size:24px;">⏱️</div>\n                        <div>\n                            <div style="font-weight:900; color:#2ecc71; font-size:12px; letter-spacing:1px;">สถานะ CRON ล่าสุด</div>\n                            <div id="cronStatusDisplay" style="color:#064e3b; font-weight:bold; font-size:14px;">กำลังโหลด...</div>\n                        </div>\n                    </div>\n';

const jsSearchStr = "const pApkVer = document.getElementById('latestApkVersion');";
const jsInjectStr = "const pApkVer = document.getElementById('latestApkVersion');\n                        const pCron = document.getElementById('cronStatusDisplay');\n                        if (pCron) pCron.innerText = data.lastCronStatus || 'ยังไม่มีประวัติการรันอัตโนมัติ';";

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('cronStatusDisplay')) {
            content = content.replace(searchStr, injectStr);
            content = content.replace(jsSearchStr, jsInjectStr);
            fs.writeFileSync(file, content);
            console.log(`Patched ${file}`);
        } else {
            console.log(`${file} already patched`);
        }
    }
});
