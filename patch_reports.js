const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add CSS for date picker in dark mode
    const targetStyle = `    <style>`;
    const replaceStyle = `    <style>
        .dark input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.6;
        }`;
    content = content.replace(targetStyle, replaceStyle);

    // 2. Add Area Filter UI in Reports
    const targetFilterUI = `<select id="reportMachineFilter"`;
    const replaceFilterUI = `<label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกพื้นที่</label>
                        <select id="reportAreaFilter" onchange="filterReports()" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all appearance-none cursor-pointer mb-4">
                            <option value="all">🌍 ทุกพื้นที่</option>
                        </select>
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกตู้กดน้ำ</label>
                        <select id="reportMachineFilter"`;
    content = content.replace(targetFilterUI, replaceFilterUI);

    // 3. Add Area Header in Reports Table
    const targetReportTh = `<th class="py-4 px-6 align-middle whitespace-nowrap">ตู้</th>
                                    <th class="py-4 px-6 align-middle whitespace-nowrap">ปริมาณ (L)</th>`;
    const replaceReportTh = `<th class="py-4 px-6 align-middle whitespace-nowrap">ตู้</th>
                                    <th class="py-4 px-6 align-middle whitespace-nowrap">พื้นที่ (Area)</th>
                                    <th class="py-4 px-6 align-middle whitespace-nowrap">ปริมาณ (L)</th>`;
    content = content.replace(targetReportTh, replaceReportTh);

    // 4. Update filterReports logic (get Area filter value)
    const targetFilterLogic = `const machineFilter = document.getElementById('reportMachineFilter').value;`;
    const replaceFilterLogic = `const machineFilter = document.getElementById('reportMachineFilter').value;
            const areaFilter = document.getElementById('reportAreaFilter') ? document.getElementById('reportAreaFilter').value : 'all';`;
    content = content.replace(targetFilterLogic, replaceFilterLogic);

    // 5. Update filterReports logic (apply Area filter)
    const targetFilterApply = `// 🛑 1. Machine Filter
                const matchM = machineFilter === 'all' || d.machine === machineFilter;`;
    const replaceFilterApply = `// 🌍 0. Area Filter
                let txAreaId = null;
                if (d.machine) {
                    const foundMachine = (typeof latestMachines !== 'undefined' ? latestMachines : []).find(m => m.id === d.machine);
                    if (foundMachine) txAreaId = foundMachine.areaId;
                }
                const matchA = areaFilter === 'all' || txAreaId === areaFilter;

                // 🛑 1. Machine Filter
                const matchM = machineFilter === 'all' || d.machine === machineFilter;`;
    content = content.replace(targetFilterApply, replaceFilterApply);
    
    // Change return to include matchA
    const targetFilterReturn = `return matchM && matchT && matchD;`;
    const replaceFilterReturn = `return matchA && matchM && matchT && matchD;`;
    content = content.replace(targetFilterReturn, replaceFilterReturn);

    // 6. Update report row rendering
    const targetReportTd = `<td class="py-4 px-6 align-middle whitespace-nowrap">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-950 dark:text-slate-100 text-sm italic leading-none">\${machineNamesMap[d.machine] || d.machine || '---'}</span>
                            \${machineNamesMap[d.machine] ? \`<span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">\${d.machine}</span>\` : ''}
                        </div>
                    </td>
                    <td class="py-4 px-6 align-middle whitespace-nowrap font-black text-slate-900 dark:text-slate-100 tabular-nums text-base">\${(d.vol || 0).toFixed(1)} <span class="text-xs text-slate-400 font-bold ml-1">L.</span></td>`;
    
    const replaceReportTd = `<td class="py-4 px-6 align-middle whitespace-nowrap">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-950 dark:text-slate-100 text-sm italic leading-none">\${machineNamesMap[d.machine] || d.machine || '---'}</span>
                            \${machineNamesMap[d.machine] ? \`<span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">\${d.machine}</span>\` : ''}
                        </div>
                    </td>
                    <td class="py-4 px-6 align-middle whitespace-nowrap">
                        <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 inline-block">\${txAreaId ? (typeof areaMap !== 'undefined' ? areaMap[txAreaId] || 'ไม่ทราบพื้นที่' : 'ไม่ทราบพื้นที่') : 'ไม่ทราบพื้นที่'}</span>
                    </td>
                    <td class="py-4 px-6 align-middle whitespace-nowrap font-black text-slate-900 dark:text-slate-100 tabular-nums text-base">\${(d.vol || 0).toFixed(1)} <span class="text-xs text-slate-400 font-bold ml-1">L.</span></td>`;
    content = content.replace(targetReportTd, replaceReportTd);

    // 7. Update exportReportsCSV
    const targetExportHeader = `let csv = "No,DateTime,User,Machine,Volume(L),TDS_In,TDS_Out,pH,Method\\n";`;
    const replaceExportHeader = `let csv = "No,DateTime,User,Machine,Area,Volume(L),TDS_In,TDS_Out,pH,Method\\n";`;
    content = content.replace(targetExportHeader, replaceExportHeader);

    const targetExportLoop = `const machine = tr.querySelectorAll("td")[3]?.innerText.replace(/\\n/g, " ") || "";
                const vol = tr.querySelectorAll("td")[4]?.innerText.replace(" L.", "") || "0";
                const method = tr.querySelectorAll("td")[7]?.innerText || "";
                
                csv += \`"\${idx+1}","\${date}","\${user}","\${machine}","\${vol}","\${tdsIn}","\${tdsOut}","\${ph}","\${method}"\\n\`;`;
                
    const replaceExportLoop = `const machine = tr.querySelectorAll("td")[3]?.innerText.replace(/\\n/g, " ") || "";
                const area = tr.querySelectorAll("td")[4]?.innerText.replace(/\\n/g, " ") || "";
                const vol = tr.querySelectorAll("td")[5]?.innerText.replace(" L.", "") || "0";
                const method = tr.querySelectorAll("td")[8]?.innerText || "";
                
                csv += \`"\${idx+1}","\${date}","\${user}","\${machine}","\${area}","\${vol}","\${tdsIn}","\${tdsOut}","\${ph}","\${method}"\\n\`;`;
    content = content.replace(targetExportLoop, replaceExportLoop);

    fs.writeFileSync(file, content);
    console.log("✅ Reports UI Patched");
} else {
    console.error("File not found:", file);
}
