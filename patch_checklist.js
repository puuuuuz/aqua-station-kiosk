const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const targetFunction = `            sortedMachines.forEach(m => {
                const isChecked = m.areaId === areaId;
                const isOtherArea = m.areaId && m.areaId !== areaId;
                const otherAreaText = isOtherArea && typeof areaMap !== 'undefined' && areaMap[m.areaId] ? \` (ผูกอยู่กับ: \${areaMap[m.areaId]})\` : '';
                
                const div = document.createElement('label');
                div.className = "flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-all";
                div.innerHTML = \`
                    <input type="checkbox" value="\${m.id}" class="area-machine-checkbox w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" \${isChecked ? 'checked' : ''}>
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300">\${m.name || m.id}\${isOtherArea ? \`<span class="text-[10px] text-slate-400 italic">\${otherAreaText}</span>\` : ''}</span>
                \`;
                container.appendChild(div);
            });`;

    const replacement = `            let renderCount = 0;
            sortedMachines.forEach(m => {
                const isChecked = m.areaId === areaId;
                const isOtherArea = m.areaId && m.areaId !== areaId;
                
                // Do not render machines bound to other areas
                if (isOtherArea) return;
                
                const div = document.createElement('label');
                div.className = "flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-all";
                div.innerHTML = \`
                    <input type="checkbox" value="\${m.id}" class="area-machine-checkbox w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" \${isChecked ? 'checked' : ''}>
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300">\${m.name || m.id}</span>
                \`;
                container.appendChild(div);
                renderCount++;
            });
            
            if (renderCount === 0) {
                container.innerHTML = '<p class="text-[10px] text-slate-400 font-bold p-2 text-center">ไม่มีตู้ว่างที่สามารถผูกเพิ่มได้</p>';
            }`;

    if (content.includes(targetFunction)) {
        content = content.replace(targetFunction, replacement);
        fs.writeFileSync(file, content);
        console.log('Successfully updated machine checklist logic.');
    } else {
        console.log('Target function not found.');
    }
}
