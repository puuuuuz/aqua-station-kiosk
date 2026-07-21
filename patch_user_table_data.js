const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Generate area name
    const targetVar = `                if (maxQuota === 0) {`;
    const replaceVar = `                const userAreaName = u.areaId ? (areaMap[u.areaId] || 'ไม่ทราบพื้นที่') : '<span class="text-slate-400">ยังไม่ผูกพื้นที่</span>';
                if (maxQuota === 0) {`;
    
    // Add the td before status td
    const targetTd = `                    <td class="py-4 px-3 align-middle whitespace-nowrap text-center">
                        <span class="px-2.5 py-1 \${u.status === 'approved'`;
    const replaceTd = `                    <td class="py-4 px-3 align-middle whitespace-nowrap text-center">
                        <div class="text-[11px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 inline-block">\${userAreaName}</div>
                    </td>
                    <td class="py-4 px-3 align-middle whitespace-nowrap text-center">
                        <span class="px-2.5 py-1 \${u.status === 'approved'`;
    
    content = content.replace(targetVar, replaceVar);
    content = content.replace(targetTd, replaceTd);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed User Table Area Column Data");
} else {
    console.error("File not found:", file);
}
