const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Generate area name before tr.innerHTML
    const targetVar = `                tr.innerHTML = \``;
    const replaceVar = `                const userAreaName = u.areaId ? (areaMap[u.areaId] || 'ไม่ทราบพื้นที่') : '<span class="text-slate-400">ยังไม่ผูกพื้นที่</span>';
                tr.innerHTML = \``;
    
    content = content.replace(targetVar, replaceVar);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed ReferenceError for userAreaName");
} else {
    console.error("File not found:", file);
}
