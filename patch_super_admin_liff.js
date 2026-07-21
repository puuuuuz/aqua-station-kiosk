const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add liffId input to Area Modal
    const targetAreaModalHtml = `                <div class="space-y-1 pb-2">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ตู้กดน้ำในพื้นที่ (Machines)</label>`;
    
    const replaceAreaModalHtml = `                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">LIFF ID (สำหรับ LINE OA พื้นที่นี้)</label>
                    <input type="text" id="areaLiffId" placeholder="เช่น 2009501254-Ab3SWZfh" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                    <p class="text-[9px] text-slate-400 font-bold mt-1">เว้นว่างไว้หากต้องการใช้ LIFF ID กลางของระบบ</p>
                </div>
                <div class="space-y-1 pb-2">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ตู้กดน้ำในพื้นที่ (Machines)</label>`;
    content = content.replace(targetAreaModalHtml, replaceAreaModalHtml);

    // 2. Clear liffId in openAddAreaModal
    const targetOpenAdd = `            document.getElementById('areaPin').value = '';`;
    const replaceOpenAdd = `            document.getElementById('areaPin').value = '';
            document.getElementById('areaLiffId').value = '';`;
    content = content.replace(targetOpenAdd, replaceOpenAdd);

    // 3. Populate liffId in openEditAreaModal and pass liffId as argument
    const targetOpenEditCall = `                            <button onclick="openEditAreaModal('\${documentSnapshot.id}', '\${data.name}', '\${data.technicianPin || ''}', '\${data.province || ''}', '\${data.district || ''}', '\${data.subdistrict || ''}')"`;
    const replaceOpenEditCall = `                            <button onclick="openEditAreaModal('\${documentSnapshot.id}', '\${data.name}', '\${data.technicianPin || ''}', '\${data.province || ''}', '\${data.district || ''}', '\${data.subdistrict || ''}', '\${data.liffId || ''}')"`;
    content = content.replace(targetOpenEditCall, replaceOpenEditCall);

    const targetOpenEditDef = `        window.openEditAreaModal = (id, name, pin, savedProv, savedDist, savedSub) => {`;
    const replaceOpenEditDef = `        window.openEditAreaModal = (id, name, pin, savedProv, savedDist, savedSub, liffId) => {
            document.getElementById('areaLiffId').value = liffId || '';`;
    content = content.replace(targetOpenEditDef, replaceOpenEditDef);

    // 4. Save liffId in saveArea
    const targetSaveVals = `            const pin = document.getElementById('areaPin').value.trim();`;
    const replaceSaveVals = `            const pin = document.getElementById('areaPin').value.trim();
            const liffId = document.getElementById('areaLiffId').value.trim();`;
    content = content.replace(targetSaveVals, replaceSaveVals);

    const targetSaveUpdate = `                        name: name,
                        technicianPin: pin,`;
    const replaceSaveUpdate = `                        name: name,
                        technicianPin: pin,
                        liffId: liffId,`;
    // Replace all instances (there are two: addDoc and updateDoc)
    content = content.split(targetSaveUpdate).join(replaceSaveUpdate);

    // 5. User Table Area Filter and Column
    // Need to find where users table headers are rendered
    const targetUserTh = `<th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">สถานะ</th>`;
    const replaceUserTh = `<th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">พื้นที่ (Area)</th>
                                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">สถานะ</th>`;
    content = content.replace(targetUserTh, replaceUserTh);

    const targetUserTd = `                                    <td class="px-6 py-4 whitespace-nowrap">
                                        \${statusBadge}
                                    </td>`;
    const replaceUserTd = `                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-bold text-slate-600 dark:text-slate-300">\${user.areaId ? (areaMap[user.areaId] || 'ไม่ทราบพื้นที่') : '<span class="text-slate-400">ยังไม่ผูกพื้นที่</span>'}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        \${statusBadge}
                                    </td>`;
    content = content.replace(targetUserTd, replaceUserTd);

    // 6. User Area Filter HTML
    const targetUserFilterHtml = `            <div class="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
                <div class="relative flex-1 min-w-[250px]">`;
    const replaceUserFilterHtml = `            <div class="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
                <div class="relative w-[200px]">
                    <select id="userAreaFilter" onchange="filterUsers()" class="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 pl-4 pr-10 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all appearance-none cursor-pointer">
                        <option value="all">ทุกพื้นที่ (All Areas)</option>
                        <!-- Area options will be injected here -->
                    </select>
                    <svg class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <div class="relative flex-1 min-w-[250px]">`;
    content = content.replace(targetUserFilterHtml, replaceUserFilterHtml);

    // 7. Render Area Options in filter and modify filter logic
    const targetSyncUsers = `        const syncUsers = () => {`;
    const replaceSyncUsers = `        const syncUsers = () => {
            // Update Area Filter Options
            const userAreaFilter = document.getElementById('userAreaFilter');
            if (userAreaFilter) {
                const currentVal = userAreaFilter.value;
                userAreaFilter.innerHTML = '<option value="all">ทุกพื้นที่ (All Areas)</option><option value="none">ยังไม่ผูกพื้นที่</option>';
                Object.keys(areaMap).forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = areaMap[id];
                    userAreaFilter.appendChild(opt);
                });
                userAreaFilter.value = currentVal;
            }
`;
    content = content.replace(targetSyncUsers, replaceSyncUsers);

    const targetFilterUserLogic = `            const q = searchInput.value.toLowerCase();`;
    const replaceFilterUserLogic = `            const q = searchInput.value.toLowerCase();
            const areaFilter = document.getElementById('userAreaFilter') ? document.getElementById('userAreaFilter').value : 'all';`;
    content = content.replace(targetFilterUserLogic, replaceFilterUserLogic);

    const targetFilterCondition = `                const matchesSearch = !q || name.includes(q) || uid.includes(q) || phone.includes(q);
                return matchesSearch;`;
    const replaceFilterCondition = `                const matchesSearch = !q || name.includes(q) || uid.includes(q) || phone.includes(q);
                let matchesArea = true;
                if (areaFilter === 'none') {
                    matchesArea = !u.areaId;
                } else if (areaFilter !== 'all') {
                    matchesArea = u.areaId === areaFilter;
                }
                return matchesSearch && matchesArea;`;
    content = content.replace(targetFilterCondition, replaceFilterCondition);

    fs.writeFileSync(file, content);
    console.log("✅ Patched super_admin.html with Multi-Tenant UI.");
} else {
    console.error("File not found:", file);
}
