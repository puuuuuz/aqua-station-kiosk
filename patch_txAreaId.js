const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix txAreaId ReferenceError
    const targetTd = `<td class="py-4 px-6 align-middle whitespace-nowrap">
                        <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 inline-block">\${txAreaId ? (typeof areaMap !== 'undefined' ? areaMap[txAreaId] || 'ไม่ทราบพื้นที่' : 'ไม่ทราบพื้นที่') : 'ไม่ทราบพื้นที่'}</span>
                    </td>`;
    
    const replaceTd = `<td class="py-4 px-6 align-middle whitespace-nowrap">
                        \${(() => {
                            let txAreaIdLocal = null;
                            if (d.machine) {
                                const foundMachine = (typeof latestMachines !== 'undefined' ? latestMachines : []).find(m => m.id === d.machine);
                                if (foundMachine) txAreaIdLocal = foundMachine.areaId;
                            }
                            return \`<span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 inline-block">\${txAreaIdLocal ? (typeof areaMap !== 'undefined' ? areaMap[txAreaIdLocal] || 'ไม่ทราบพื้นที่' : 'ไม่ทราบพื้นที่') : 'ไม่ทราบพื้นที่'}</span>\`;
                        })()}
                    </td>`;
                    
    content = content.replace(targetTd, replaceTd);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed txAreaId in Report Table");
} else {
    console.error("File not found:", file);
}
