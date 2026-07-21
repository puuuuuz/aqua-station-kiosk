const fs = require('fs');

const filesToPatch = ['admin.html', 'super_admin.html'];

for (const file of filesToPatch) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Fix <h3 class="...">ออนไลน์ล่าสุด</h3> to have dark:text-slate-100
    content = content.replace(
        '<h3 class="text-sm font-black text-slate-900 mb-6 tracking-tight italic">ออนไลน์ล่าสุด</h3>',
        '<h3 class="text-sm font-black text-slate-900 dark:text-slate-100 mb-6 tracking-tight italic">ออนไลน์ล่าสุด</h3>'
    );

    // Fix card rendering for admin.html (and standardize super_admin.html)
    // We'll replace the block from `const card = document.createElement('div');` to `dashboardList.appendChild(card);`
    // Wait, it's easier to use a regex to replace the innerHTML assignment.

    const newHTML = `
                    const card = document.createElement('div');
                    card.className = "flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:shadow-md transition-all cursor-pointer group";
                    card.onclick = () => openEditModal(dev.id, dev.name || '', finalLat, finalLng);
                    card.innerHTML = \`
                        <div class="flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full \${!isOnline ? 'bg-slate-300 dark:bg-slate-600' : (dev.status === 'hardware_offline' ? 'bg-fuchsia-600 animate-pulse shadow-[0_0_6px_rgba(192,38,211,0.8)]' : (dev.water_empty ? 'bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.8)]' : (dev.producing_water ? 'bg-orange-500 animate-pulse shadow-[0_0_6px_rgba(249,115,22,0.8)]' : (dev.no_tap_water ? 'bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]' : (isDispensing ? 'bg-sky-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.8)]' : (dev.water_full ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]'))))))}"></span>
                            <div>
                                <p class="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">\${dev.name || dev.id}</p>
                                <p class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1 italic tracking-widest">\${dev.id}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[11px] font-black text-slate-950 dark:text-white tabular-nums leading-none">\${totalWater.toFixed(1)} L</p>
                            <p class="text-[8px] font-bold \${!isOnline ? 'text-slate-400 dark:text-slate-500' : (dev.status === 'hardware_offline' ? 'text-fuchsia-500' : (dev.water_empty ? 'text-rose-500' : (dev.producing_water ? 'text-orange-500' : (dev.no_tap_water ? 'text-amber-500' : (isDispensing ? 'text-sky-400' : (dev.water_full ? 'text-emerald-500' : 'text-emerald-500'))))))} mt-1 italic">
                                \${!isOnline ? 'ออฟไลน์' : (dev.status === 'hardware_offline' ? 'ติดต่อบอร์ดไม่ได้' : (dev.water_empty ? 'น้ำหมดถัง' : (dev.producing_water ? 'กำลังผลิตน้ำ' : (dev.no_tap_water ? 'น้ำประปาไม่เข้า' : (isDispensing ? '💧 กำลังจ่ายน้ำ' : (dev.water_full ? '✅ ปกติ (ออนไลน์) น้ำเต็มถัง' : 'ปกติ (ออนไลน์)'))))))}
                            </p>
                        </div>
                    \`;
                    dashboardList.appendChild(card);
    `;

    // To replace safely, we'll slice from `if (dashboardList) {` down to `dashboardList.appendChild(card);` + `\n                }`
    const startIdx = content.indexOf('if (dashboardList) {');
    const endStr = 'dashboardList.appendChild(card);\n                }';
    const endIdx = content.indexOf(endStr, startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx + 'if (dashboardList) {'.length) + 
                  '\n' + newHTML + '\n                }' +
                  content.substring(endIdx + endStr.length);
    }
    
    fs.writeFileSync(file, content);
}
