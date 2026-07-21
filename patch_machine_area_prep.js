const fs = require('fs');

let content = fs.readFileSync('super_admin.html', 'utf8');

// 1. Add editDeviceAreaId to the modal
if (!content.includes('editDeviceAreaId')) {
    const areaSelectHtml = `
                <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-[1.5px] text-slate-500 dark:text-slate-400 italic font-bold">พื้นที่/เทศบาลที่ติดตั้ง (Area)</label>
                    <select id="editDeviceAreaId" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-200 dark:border-slate-600 p-3 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-inner dark:shadow-none">
                        <option value="">-- ไม่ระบุพื้นที่ --</option>
                    </select>
                </div>`;
    content = content.replace(
        '<div class="grid grid-cols-3 gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 font-display">',
        areaSelectHtml + '\n                    <div class="grid grid-cols-3 gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 font-display">'
    );
}

// 2. Populate editDeviceAreaId inside openEditModal
if (!content.includes("document.getElementById('editDeviceAreaId').value = device.areaId || '';")) {
    content = content.replace(
        "document.getElementById('editDeviceName').value = device.name || '';",
        "document.getElementById('editDeviceName').value = device.name || '';\n            document.getElementById('editDeviceAreaId').value = device.areaId || '';"
    );
}

// 3. Save editDeviceAreaId inside saveDevice (which doesn't exist directly, it's saveSettings?)
// Let's check how saving works. In editModal, the save button is:
// <button onclick="saveSettings(event)" ...>บันทึกข้อมูลตู้</button>
// Wait, in my previous view, the bottom of editModal has:
// `<div class="pt-4 flex gap-3"><button onclick="closeEditModal()">ยกเลิก</button><button onclick="saveDeviceSettings()">บันทึกข้อมูลตู้</button>` 
// Actually, let me grep for the save button of editModal first to be accurate.
