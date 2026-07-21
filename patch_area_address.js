const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Update onSnapshot(areas) to pass prov, dist, sub to openEditAreaModal
    // Find: <button onclick="openEditAreaModal('${documentSnapshot.id}', '${data.name}', '${data.technicianPin || ''}')"
    const targetSnapshotBtn = `<button onclick="openEditAreaModal('\${documentSnapshot.id}', '\${data.name}', '\${data.technicianPin || ''}')"`;
    if (content.includes(targetSnapshotBtn)) {
        content = content.replace(
            targetSnapshotBtn,
            `<button onclick="openEditAreaModal('\${documentSnapshot.id}', '\${data.name}', '\${data.technicianPin || ''}', '\${data.province || ''}', '\${data.district || ''}', '\${data.subdistrict || ''}')"`
        );
    }

    // 2. Update openEditAreaModal signature and logic
    const targetOpenEditModal = `window.openEditAreaModal = (id, name, pin) => {
            document.getElementById('editAreaId').value = id;
            document.getElementById('areaPin').value = pin;
            document.getElementById('areaCustomName').value = name;`;

    if (content.includes(targetOpenEditModal)) {
        content = content.replace(
            targetOpenEditModal,
            `window.openEditAreaModal = (id, name, pin, savedProv, savedDist, savedSub) => {
            document.getElementById('editAreaId').value = id;
            document.getElementById('areaPin').value = pin;
            document.getElementById('areaCustomName').value = name;
            
            // Set dropdowns if saved data exists
            setTimeout(() => {
                const provSelect = document.getElementById('areaProv');
                const distSelect = document.getElementById('areaDist');
                const subSelect = document.getElementById('areaSub');
                if (savedProv) {
                    provSelect.value = savedProv;
                    provSelect.onchange();
                    if (savedDist) {
                        distSelect.value = savedDist;
                        distSelect.onchange();
                        if (savedSub) {
                            subSelect.value = savedSub;
                        }
                    }
                }
            }, 50);`
        );
    }

    // 3. Update saveArea to save prov, dist, sub to DB
    const targetSaveArea = `await updateDoc(doc(db, 'areas', id), {
                        name: name,
                        technicianPin: pin,
                        updatedAt: serverTimestamp()
                    });`;
                    
    const newSaveAreaHtml = `await updateDoc(doc(db, 'areas', id), {
                        name: name,
                        technicianPin: pin,
                        province: prov,
                        district: dist,
                        subdistrict: sub,
                        updatedAt: serverTimestamp()
                    });`;
                    
    const targetAddArea = `await addDoc(collection(db, 'areas'), {
                        name: name,
                        technicianPin: pin,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });`;
                    
    const newAddAreaHtml = `await addDoc(collection(db, 'areas'), {
                        name: name,
                        technicianPin: pin,
                        province: prov,
                        district: dist,
                        subdistrict: sub,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });`;

    if (content.includes(targetSaveArea) && content.includes(targetAddArea)) {
        content = content.replace(targetSaveArea, newSaveAreaHtml);
        content = content.replace(targetAddArea, newAddAreaHtml);
    }
    
    fs.writeFileSync(file, content);
    console.log('Patched Area Address Dropdowns inside ' + file);
}
