const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add machine count to area table rendering
    const targetRowHtml = `<td class="py-4 px-6 font-black text-indigo-500 tracking-[4px] text-[16px]">\${data.technicianPin || '------'}</td>`;
    if (content.includes(targetRowHtml) && !content.includes('bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700')) {
        content = content.replace(
            targetRowHtml,
            targetRowHtml + `\n                    <td class="py-4 px-6 font-bold text-slate-600 dark:text-slate-400">\n                        <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700">\${machineCount} ตู้</span>\n                    </td>`
        );
        fs.writeFileSync(file, content);
        console.log('Patched machine count row in ' + file);
    }
}
