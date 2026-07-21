const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Table Headers
    const targetTh = `<th class="py-4 px-3 text-center whitespace-nowrap">สถานะ</th>`;
    const replaceTh = `<th class="py-4 px-3 text-center whitespace-nowrap">พื้นที่ (Area)</th>
                                    <th class="py-4 px-3 text-center whitespace-nowrap">สถานะ</th>`;
    content = content.replace(targetTh, replaceTh);

    // 2. Table Row Generation
    const targetTd = `const statusBadge = u.status === 'blocked' ? '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-bold">BLOCKED</span>' :`;
    const replaceTd = `
                const userAreaName = u.areaId ? (areaMap[u.areaId] || 'ไม่ทราบพื้นที่') : '<span class="text-slate-400">ยังไม่ผูกพื้นที่</span>';
                
                const statusBadge = u.status === 'blocked' ? '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-bold">BLOCKED</span>' :`;
    content = content.replace(targetTd, replaceTd);

    const targetTrRender = `                                        <td class="py-4 px-3 text-center align-middle whitespace-nowrap">\${statusBadge}</td>
                                        <td class="py-4 px-3 text-right align-middle whitespace-nowrap">`;
    const replaceTrRender = `                                        <td class="py-4 px-3 text-center align-middle whitespace-nowrap"><div class="text-[11px] font-bold text-slate-500">\${userAreaName}</div></td>
                                        <td class="py-4 px-3 text-center align-middle whitespace-nowrap">\${statusBadge}</td>
                                        <td class="py-4 px-3 text-right align-middle whitespace-nowrap">`;
    content = content.replace(targetTrRender, replaceTrRender);


    // 3. Area Filter in UI
    const targetFilterUI = `                            <div class="relative min-w-[180px]">
                                <select id="userStatusFilter"`;
    const replaceFilterUI = `                            <div class="relative min-w-[180px]">
                                <select id="userAreaFilter" onchange="filterUsers()" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-200 dark:border-slate-600 px-5 py-2.5 rounded-2xl font-black text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-[13px] transition-all shadow-inner dark:shadow-none cursor-pointer">
                                    <option value="all">🌍 ทุกพื้นที่</option>
                                    <option value="none">⚠️ ยังไม่ผูกพื้นที่</option>
                                </select>
                            </div>
                            <div class="relative min-w-[180px]">
                                <select id="userStatusFilter"`;
    content = content.replace(targetFilterUI, replaceFilterUI);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed User Table Area Columns");
} else {
    console.error("File not found:", file);
}
