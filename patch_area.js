const fs = require('fs');

let content = fs.readFileSync('super_admin.html', 'utf8');

// 1. Add areaCustomName to HTML
if (!content.includes('id="areaCustomName"')) {
    const htmlToInsert = `
                <div class="space-y-1 pb-2">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ชื่อพื้นที่ (Area Name)</label>
                    <input type="text" id="areaCustomName" placeholder="เช่น เทศบาลด่านสำโรง" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                    <p class="text-[9px] text-slate-400 font-bold mt-1">กรณีไม่มีในตัวเลือกด้านล่าง สามารถพิมพ์ระบุเองได้เลย</p>
                </div>`;
    content = content.replace('<div class="space-y-1">\n                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">จังหวัด (Province)</label>', htmlToInsert + '\n                <div class="space-y-1">\n                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">จังหวัด (Province)</label>');
}

// 2. Add auto-fill to subSelect.onchange in initAddressDropdowns
if (!content.includes('areaCustomName').value) {
    // wait, we need to inject into subSelect.disabled = false
    const target = 'ThailandAddressLib.getSubDistricts(prov, dist).forEach(s => subSelect.innerHTML += `<option value="${s}">${s}</option>`);';
    const replacement = target + `
                    subSelect.onchange = () => {
                        const s = subSelect.value;
                        if(prov && dist && s) {
                            document.getElementById('areaCustomName').value = \`ต.\${s} อ.\${dist} จ.\${prov}\`;
                        }
                    };`;
    content = content.replace(target, replacement);
}

// 3. Update openAddAreaModal
content = content.replace(
    "document.getElementById('areaProv').value = '';",
    "document.getElementById('areaCustomName').value = '';\n            document.getElementById('areaProv').value = '';"
);

// 4. Update openEditAreaModal
content = content.replace(
    "document.getElementById('areaPin').value = pin;",
    "document.getElementById('areaPin').value = pin;\n            document.getElementById('areaCustomName').value = name;"
);

// 5. Update saveArea
const oldSaveArea = `        window.saveArea = async () => {
            const id = document.getElementById('editAreaId').value;
            const prov = document.getElementById('areaProv').value;
            const dist = document.getElementById('areaDist').value;
            const sub = document.getElementById('areaSub').value;
            const pin = document.getElementById('areaPin').value.trim();
            
            if(!prov || !dist || !sub || pin.length < 4) {
                alert('กรุณาเลือกพื้นที่ให้ครบถ้วน และกำหนด PIN อย่างน้อย 4 หลัก');
                return;
            }
            
            const name = \`ต.\${sub} อ.\${dist} จ.\${prov}\`;`;

const newSaveArea = `        window.saveArea = async () => {
            const id = document.getElementById('editAreaId').value;
            const prov = document.getElementById('areaProv').value;
            const dist = document.getElementById('areaDist').value;
            const sub = document.getElementById('areaSub').value;
            const customName = document.getElementById('areaCustomName').value.trim();
            const pin = document.getElementById('areaPin').value.trim();
            
            if(!customName || pin.length < 4) {
                alert('กรุณาระบุชื่อพื้นที่ และกำหนด PIN อย่างน้อย 4 หลัก');
                return;
            }
            
            const name = customName;`;

content = content.replace(oldSaveArea, newSaveArea);

fs.writeFileSync('super_admin.html', content);
