const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add Area name to Machine Table
    const targetHtml = `<td class="py-4 px-6 align-middle font-bold text-slate-900 dark:text-slate-100 tracking-tight text-[15px] leading-tight min-w-[200px]">\${dev.name || '---'}</td>`;
    if (content.includes(targetHtml)) {
        content = content.replace(
            targetHtml,
            `<td class="py-4 px-6 align-middle font-bold text-slate-900 dark:text-slate-100 tracking-tight text-[15px] leading-tight min-w-[200px]">
                        \${dev.name || '---'}
                        \${(dev.areaId && typeof areaMap !== 'undefined' && areaMap[dev.areaId]) ? \`<div class="mt-1"><span class="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[9px] font-black italic shadow-sm">📍 \${areaMap[dev.areaId]}</span></div>\` : ''}
                    </td>`
        );
        fs.writeFileSync(file, content);
        console.log('Patched machine list row in ' + file);
    } else {
        console.log('Could not find target html for machine list row.');
    }
}
