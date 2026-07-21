const fs = require('fs');

const filesToPatch = ['super_admin.html', 'admin.html'];

for (const file of filesToPatch) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // 1. CSS for .pulse-offline
    if (!content.includes('.pulse-offline .pulse-ring')) {
        content = content.replace(
            "/* Critical Health Pulse */",
            "/* Offline Pulse */\n        .pulse-offline .pulse-ring { border-color: #64748b; border-width: 4px; }\n        .pulse-offline .pulse-dot { background: #64748b; box-shadow: 0 0 15px rgba(100,116,139,0.5); }\n\n        /* Critical Health Pulse */"
        );
    }

    // 2. Add editDeviceAreaId to the modal
    if (!content.includes('id="editDeviceAreaId"')) {
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

    // 3. Populate editDeviceAreaId inside openEditModal
    if (!content.includes("document.getElementById('editDeviceAreaId').value = device.areaId || '';")) {
        content = content.replace(
            "document.getElementById('editDeviceName').value = device.name || '';",
            "document.getElementById('editDeviceName').value = device.name || '';\n            if(document.getElementById('editDeviceAreaId')) document.getElementById('editDeviceAreaId').value = device.areaId || '';"
        );
    }

    // 4. Save editDeviceAreaId in saveDevice
    if (!content.includes("const areaId = document.getElementById('editDeviceAreaId')?.value;")) {
        content = content.replace(
            "const n = document.getElementById('editDeviceName').value;",
            "const n = document.getElementById('editDeviceName').value;\n            const areaId = document.getElementById('editDeviceAreaId')?.value;"
        );
        content = content.replace(
            "name: n,",
            "name: n,\n                    areaId: areaId || deleteField(),"
        );
    }

    // 5. Populate options for editDeviceAreaId
    if (!content.includes("const deviceAreaSelect = document.getElementById('editDeviceAreaId');")) {
        // Find area population
        content = content.replace(
            "const adminAreaSelect = document.getElementById('adminAreaId');",
            "const adminAreaSelect = document.getElementById('adminAreaId');\n            const deviceAreaSelect = document.getElementById('editDeviceAreaId');"
        );
        content = content.replace(
            "if(adminAreaSelect) adminAreaSelect.innerHTML = '<option value=\"\">-- เลือกพื้นที่ --</option>';",
            "if(adminAreaSelect) adminAreaSelect.innerHTML = '<option value=\"\">-- เลือกพื้นที่ --</option>';\n            if(deviceAreaSelect) deviceAreaSelect.innerHTML = '<option value=\"\">-- ไม่ระบุพื้นที่ --</option>';"
        );
        content = content.replace(
            "if(adminAreaSelect) {\n                    adminAreaSelect.innerHTML += `<option value=\"${documentSnapshot.id}\">${data.name}</option>`;\n                }",
            "if(adminAreaSelect) {\n                    adminAreaSelect.innerHTML += `<option value=\"${documentSnapshot.id}\">${data.name}</option>`;\n                }\n                if(deviceAreaSelect) {\n                    deviceAreaSelect.innerHTML += `<option value=\"${documentSnapshot.id}\">${data.name}</option>`;\n                }"
        );
    }

    // 6. Show Area name in Machine List table
    // It's around ${dev.name || 'ไม่ได้ตั้งชื่อ'}
    if (!content.includes("areaMap[dev.areaId]")) {
        // Find: <h4 class="font-black text-slate-900 text-[13px] italic flex items-center gap-1">\n                                    ${dev.name || 'ไม่ได้ตั้งชื่อ'}
        content = content.replace(
            "${dev.name || 'ไม่ได้ตั้งชื่อ'}",
            "${dev.name || 'ไม่ได้ตั้งชื่อ'}\n                                    ${(dev.areaId && typeof areaMap !== 'undefined' && areaMap[dev.areaId]) ? `<span class=\"bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[9px] font-black italic ml-1\">📍 ${areaMap[dev.areaId]}</span>` : ''}"
        );
    }
    
    // 7. Show total machine counts in Area table (only for super_admin.html)
    // The tbody id="areaTableBody" rendering:
    if (file === 'super_admin.html') {
        if (!content.includes("<th>จำนวนตู้</th>")) {
            // Update table headers
            content = content.replace(
                '<th class="py-4 px-6 font-black uppercase tracking-[2px]">พื้นที่/เทศบาล</th>',
                '<th class="py-4 px-6 font-black uppercase tracking-[2px]">พื้นที่/เทศบาล</th>\n                                        <th class="py-4 px-6 font-black uppercase tracking-[2px]">จำนวนตู้น้ำ</th>'
            );
        }
        
        // Wait, areaTableBody rendering doesn't have the machines array available directly inside the onSnapshot of areas.
        // Let's modify the onSnapshot of 'areas' to look up allMachines to count.
        // We have `allMachines` populated from `onSnapshot(collection(db, 'machines'))` usually.
        // Let's replace the area row rendering to count machines.
        if (!content.includes("const machineCount = allMachines ? allMachines.filter(m => m.areaId === documentSnapshot.id).length : 0;")) {
            content = content.replace(
                "const data = documentSnapshot.data();",
                "const data = documentSnapshot.data();\n                const machineCount = (typeof allMachines !== 'undefined') ? allMachines.filter(m => m.areaId === documentSnapshot.id).length : 0;"
            );
            
            content = content.replace(
                '<td class="py-4 px-6">\n                            <span class="font-black text-slate-900 dark:text-slate-100">${data.name}</span>\n                        </td>',
                '<td class="py-4 px-6">\n                            <span class="font-black text-slate-900 dark:text-slate-100">${data.name}</span>\n                        </td>\n                        <td class="py-4 px-6 font-bold text-slate-600 dark:text-slate-400">\n                            ${machineCount} ตู้\n                        </td>'
            );
        }
    }

    fs.writeFileSync(file, content);
}

// Ensure the area map is updated when machines update
