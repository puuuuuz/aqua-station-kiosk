const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Fix User Area Badge logic and styling
    const targetUserAreaName = `const userAreaName = u.areaId ? (areaMap[u.areaId] || 'ไม่ทราบพื้นที่') : '<span class="text-slate-400">ยังไม่ผูกพื้นที่</span>';`;
    const replaceUserAreaName = `const userAreaBadge = (u.areaId && typeof areaMap !== 'undefined' && areaMap[u.areaId]) 
                    ? \`<span class="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black shadow-sm border border-indigo-100 dark:border-indigo-500/20">📍 \${areaMap[u.areaId]}</span>\` 
                    : (u.areaId ? \`<span class="text-slate-300 dark:text-slate-600 text-[10px] font-bold italic">ไม่ทราบพื้นที่</span>\` : \`<span class="text-slate-300 dark:text-slate-600 text-[10px] font-bold italic">-</span>\`);`;
    content = content.replace(targetUserAreaName, replaceUserAreaName);

    const targetUserAreaDiv = `<div class="text-[11px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 inline-block">\${userAreaName}</div>`;
    const replaceUserAreaDiv = `\${userAreaBadge}`;
    content = content.replace(targetUserAreaDiv, replaceUserAreaDiv);

    // 2. Fix re-render logic when areas are loaded
    const targetReRender = `if (typeof allUsers !== 'undefined' && allUsers.length > 0 && typeof renderUsers === 'function') {
                renderUsers(allUsers);
            }`;
    const replaceReRender = `if (typeof allUsers !== 'undefined' && allUsers.length > 0 && typeof window.renderUsers === 'function') {
                window.renderUsers(allUsers);
            }`;
    content = content.replace(targetReRender, replaceReRender);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed User Area Badge and re-render logic");
} else {
    console.error("File not found:", file);
}
