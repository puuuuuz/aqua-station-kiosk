const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add UI inside areaModal
    const targetHtml = `<div class="pt-4 flex gap-3">
                    <button onclick="closeAreaModal()" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all">ยกเลิก</button>`;
    
    const uiHtml = `
                <div class="space-y-1 pb-2">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ตู้กดน้ำในพื้นที่ (Machines)</label>
                    <div class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar" id="areaMachineChecklist">
                        <!-- Machine checkboxes will be injected here -->
                    </div>
                </div>
                <div class="pt-4 flex gap-3">
                    <button onclick="closeAreaModal()" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all">ยกเลิก</button>`;
                    
    if (content.includes(targetHtml)) {
        content = content.replace(targetHtml, uiHtml);
    }

    // 2. Add function to render checkboxes
    const targetAddModal = `window.openAddAreaModal = () => {`;
    const renderFunction = `
        const renderAreaMachineChecklist = (areaId) => {
            const container = document.getElementById('areaMachineChecklist');
            if(!container) return;
            container.innerHTML = '';
            
            if(typeof allMachines === 'undefined' || allMachines.length === 0) {
                container.innerHTML = '<p class="text-[10px] text-slate-400 font-bold p-2 text-center">ยังไม่มีข้อมูลตู้กดน้ำ</p>';
                return;
            }
            
            // Sort machines by name
            const sortedMachines = [...allMachines].sort((a,b) => (a.name || a.id).localeCompare(b.name || b.id));
            
            sortedMachines.forEach(m => {
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
            });
        };
        
        window.openAddAreaModal = () => {`;
    
    if (content.includes(targetAddModal)) {
        content = content.replace(targetAddModal, renderFunction);
    }

    // 3. Inject render call into openAddAreaModal
    const targetAddModalInner = `document.getElementById('areaModalTitle').innerText = 'เพิ่มพื้นที่ใหม่';
            
            initAddressDropdowns();`;
    const newAddModalInner = `document.getElementById('areaModalTitle').innerText = 'เพิ่มพื้นที่ใหม่';
            
            initAddressDropdowns();
            renderAreaMachineChecklist(null);`;
            
    if (content.includes(targetAddModalInner)) {
        content = content.replace(targetAddModalInner, newAddModalInner);
    }

    // 4. Inject render call into openEditAreaModal
    const targetEditModalInner = `// Set dropdowns if saved data exists`;
    const newEditModalInner = `renderAreaMachineChecklist(id);
            
            // Set dropdowns if saved data exists`;
            
    if (content.includes(targetEditModalInner)) {
        content = content.replace(targetEditModalInner, newEditModalInner);
    }

    // 5. Update saveArea to save machines
    // We need to change saveArea to process the checkboxes after saving the Area document
    const saveAreaTarget = `await addDoc(collection(db, 'areas'), {
                        name: name,
                        technicianPin: pin,
                        province: prov,
                        district: dist,
                        subdistrict: sub,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
                closeAreaModal();`;
                
    const newSaveAreaHtml = `const newDocRef = await addDoc(collection(db, 'areas'), {
                        name: name,
                        technicianPin: pin,
                        province: prov,
                        district: dist,
                        subdistrict: sub,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    finalAreaId = newDocRef.id;
                }
                
                // Update machines via batch
                const batch = writeBatch(db);
                let hasUpdates = false;
                const checkboxes = document.querySelectorAll('.area-machine-checkbox');
                checkboxes.forEach(cb => {
                    const mId = cb.value;
                    const isChecked = cb.checked;
                    const m = allMachines.find(x => x.id === mId);
                    if(m) {
                        if(isChecked && m.areaId !== finalAreaId) {
                            batch.update(doc(db, 'machines', mId), { areaId: finalAreaId });
                            hasUpdates = true;
                        } else if (!isChecked && m.areaId === finalAreaId) {
                            batch.update(doc(db, 'machines', mId), { areaId: deleteField() });
                            hasUpdates = true;
                        }
                    }
                });
                
                if(hasUpdates) {
                    await batch.commit();
                }
                
                closeAreaModal();`;
                
    // Wait, need to declare finalAreaId
    const saveAreaStart = `const name = customName;

            try {`;
    const newSaveAreaStart = `const name = customName;

            try {
                let finalAreaId = id;`;
                
    if (content.includes(saveAreaStart) && content.includes(saveAreaTarget)) {
        content = content.replace(saveAreaStart, newSaveAreaStart);
        content = content.replace(saveAreaTarget, newSaveAreaHtml);
    }
    
    // 6. Optional: deleteArea batch removal of machines
    const deleteAreaTarget = `await deleteDoc(doc(db, 'areas', id));`;
    const newDeleteAreaHtml = `await deleteDoc(doc(db, 'areas', id));
                
                // Remove areaId from all associated machines
                const batch = writeBatch(db);
                let hasUpdates = false;
                allMachines.filter(m => m.areaId === id).forEach(m => {
                    batch.update(doc(db, 'machines', m.id), { areaId: deleteField() });
                    hasUpdates = true;
                });
                if(hasUpdates) await batch.commit();`;
                
    if (content.includes(deleteAreaTarget)) {
        content = content.replace(deleteAreaTarget, newDeleteAreaHtml);
    }

    fs.writeFileSync(file, content);
    console.log('Patched Area Machine Assignment in ' + file);
}
