const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Fix dailyVal calculation to fallback to customQuota
    const targetDailyVal = `const dailyVal = parseFloat(u.quota !== undefined ? u.quota : 2.00);`;
    const replaceDailyVal = `const dailyVal = parseFloat(u.quota !== undefined ? u.quota : (u.customQuota !== undefined ? u.customQuota : (u.litersLeft !== undefined ? u.litersLeft : 2.00)));`;
    content = content.replace(targetDailyVal, replaceDailyVal);

    // 2. Fix input box value for quota
    const targetInputQuota = `id="quota-\${u.id}" value="\${u.quota !== undefined ? u.quota : 2.00}"`;
    const replaceInputQuota = `id="quota-\${u.id}" value="\${u.quota !== undefined ? u.quota : (u.customQuota !== undefined ? u.customQuota : (u.litersLeft !== undefined ? u.litersLeft : 2.00))}"`;
    content = content.replace(targetInputQuota, replaceInputQuota);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed quota input and calculation to support customQuota fallback");
} else {
    console.error("File not found:", file);
}
