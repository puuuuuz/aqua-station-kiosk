const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Fix Area Table Headers
    const oldAreaHeaders = `<tr>
                                <th class="py-4 px-6">รหัสพื้นที่</th>
                                <th class="py-4 px-6">ชื่อพื้นที่ (ตำบล/อำเภอ/จังหวัด)</th>
                                <th class="py-4 px-6">Technician PIN</th>
                                <th class="py-4 px-8 w-24">จัดการ</th>
                            </tr>`;
    const newAreaHeaders = `<tr>
                                <th class="py-4 px-6">รหัสพื้นที่</th>
                                <th class="py-4 px-6">ชื่อพื้นที่ (ตำบล/อำเภอ/จังหวัด)</th>
                                <th class="py-4 px-6">Technician PIN</th>
                                <th class="py-4 px-6">จำนวนตู้</th>
                                <th class="py-4 px-8 w-24">จัดการ</th>
                            </tr>`;
    if (content.includes(oldAreaHeaders)) {
        content = content.replace(oldAreaHeaders, newAreaHeaders);
    }

    // 2. Fix Machine Table Headers (There are two)
    const machineHeadersOld = `<th class="py-4 px-6 align-middle whitespace-nowrap">ออนไลน์ล่าสุด</th>
                                    <th class="py-4 px-8 w-24">จัดการ</th>`;
    const machineHeadersNew = `<th class="py-4 px-6 align-middle whitespace-nowrap">ออนไลน์ล่าสุด</th>
                                    <th class="py-4 px-6 align-middle whitespace-nowrap">ดูแลโดยเทศบาล</th>
                                    <th class="py-4 px-8 w-24">จัดการ</th>`;
    content = content.replace(new RegExp(machineHeadersOld, 'g'), machineHeadersNew);

    // 3. Machine Row Rendering: Remove area from second column
    const oldSecondCol = `\${dev.name || '---'}
                        \${(dev.areaId && typeof areaMap !== 'undefined' && areaMap[dev.areaId]) ? \`<div class="mt-1"><span class="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[9px] font-black italic shadow-sm">📍 \${areaMap[dev.areaId]}</span></div>\` : ''}
                    </td>`;
    const newSecondCol = `\${dev.name || '---'}
                    </td>`;
    if (content.includes(oldSecondCol)) {
        content = content.replace(oldSecondCol, newSecondCol);
    }

    // 4. Machine Row Rendering: Add area column after Last Online
    const oldLastOnlineCol = `<td class="py-4 px-6 align-middle whitespace-nowrap text-[11px] font-black text-slate-400 tabular-nums leading-none">
                        \${lastSeenDate ? lastSeenDate.toLocaleString('th-TH') : 'ไม่เคยเชื่อมต่อ'}
                    </td>`;
    const newCols = `<td class="py-4 px-6 align-middle whitespace-nowrap text-[11px] font-black text-slate-400 tabular-nums leading-none">
                        \${lastSeenDate ? lastSeenDate.toLocaleString('th-TH') : 'ไม่เคยเชื่อมต่อ'}
                    </td>
                    <td class="py-4 px-6 align-middle whitespace-nowrap">
                        \${(dev.areaId && typeof areaMap !== 'undefined' && areaMap[dev.areaId]) ? \`<span class="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black shadow-sm border border-indigo-100 dark:border-indigo-500/20">📍 \${areaMap[dev.areaId]}</span>\` : '<span class="text-slate-300 dark:text-slate-600 text-[10px] font-bold italic">-</span>'}
                    </td>`;
    if (content.includes(oldLastOnlineCol)) {
        content = content.replace(oldLastOnlineCol, newCols);
    }
    
    // Also update empty state colspans
    content = content.replace(/colspan="11"/g, 'colspan="12"');

    fs.writeFileSync(file, content);
    console.log('Fixed Area headers and added Machine Area column');
}
