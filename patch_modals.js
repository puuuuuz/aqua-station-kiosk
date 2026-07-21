const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

const modalsHTML = `
    <!-- AREA MODAL -->
    <div id="areaModal" class="hidden fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onclick="closeAreaModal()"></div>
        <div class="relative z-10 bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slimFadeIn border border-slate-100 dark:border-slate-800">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 class="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight" id="areaModalTitle">เพิ่มพื้นที่ใหม่</h3>
                <button onclick="closeAreaModal()" class="text-slate-400 hover:text-rose-500 transition-colors">✕</button>
            </div>
            <div class="p-6 space-y-4">
                <input type="hidden" id="editAreaId">
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ชื่อพื้นที่ (Area Name)</label>
                    <input type="text" id="areaName" placeholder="เช่น กรุงเทพมหานคร" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                </div>
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">PIN รหัสช่าง (Technician PIN)</label>
                    <input type="text" id="areaPin" placeholder="เช่น 123456" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                </div>
                <div class="pt-4 flex gap-3">
                    <button onclick="closeAreaModal()" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all">ยกเลิก</button>
                    <button onclick="saveArea()" class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">บันทึกข้อมูล</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ADMIN MODAL -->
    <div id="adminModal" class="hidden fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onclick="closeAdminModal()"></div>
        <div class="relative z-10 bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slimFadeIn border border-slate-100 dark:border-slate-800">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 class="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight" id="adminModalTitle">เพิ่มบัญชีแอดมินสาขา</h3>
                <button onclick="closeAdminModal()" class="text-slate-400 hover:text-rose-500 transition-colors">✕</button>
            </div>
            <div class="p-6 space-y-4">
                <input type="hidden" id="editAdminId">
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">อีเมลแอดมิน (Email)</label>
                    <input type="email" id="adminEmail" placeholder="admin@example.com" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                </div>
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">พื้นที่รับผิดชอบ (Area)</label>
                    <select id="adminAreaId" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                        <option value="">-- เลือกพื้นที่ --</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">สถานะ (Status)</label>
                    <select id="adminStatus" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                        <option value="active">🟢 ใช้งานได้ (Active)</option>
                        <option value="suspended">🔴 ระงับการใช้งาน (Suspended)</option>
                    </select>
                </div>
                <div class="pt-4 flex gap-3">
                    <button onclick="closeAdminModal()" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all">ยกเลิก</button>
                    <button onclick="saveAdmin()" class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">บันทึกข้อมูล</button>
                </div>
            </div>
        </div>
    </div>
`;

content = content.replace('<!-- FIREBASE -->', modalsHTML + '\n    <!-- FIREBASE -->');

const jsLogic = `
        // --- LOCAL ADMIN MODAL LOGIC ---
        window.openAddAdminModal = () => {
            document.getElementById('adminModalTitle').innerText = 'เพิ่มบัญชีแอดมินสาขา';
            document.getElementById('editAdminId').value = '';
            document.getElementById('adminEmail').value = '';
            document.getElementById('adminAreaId').value = '';
            document.getElementById('adminStatus').value = 'active';
            document.getElementById('adminEmail').disabled = false;
            document.getElementById('adminModal').classList.remove('hidden');
        };

        window.openEditAdminModal = (id, email, areaId, status) => {
            document.getElementById('adminModalTitle').innerText = 'แก้ไขบัญชีแอดมินสาขา';
            document.getElementById('editAdminId').value = id;
            document.getElementById('adminEmail').value = email;
            document.getElementById('adminEmail').disabled = true; // Email is ID, shouldn't change easily
            document.getElementById('adminAreaId').value = areaId;
            document.getElementById('adminStatus').value = status || 'active';
            document.getElementById('adminModal').classList.remove('hidden');
        };

        window.closeAdminModal = () => {
            document.getElementById('adminModal').classList.add('hidden');
        };

        window.saveAdmin = async () => {
            const id = document.getElementById('editAdminId').value;
            const email = document.getElementById('adminEmail').value.trim();
            const areaId = document.getElementById('adminAreaId').value;
            const status = document.getElementById('adminStatus').value;

            if (!email || !areaId) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');

            try {
                if (id) {
                    await updateDoc(doc(db, 'users', id), {
                        areaId: areaId,
                        status: status,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // Create new admin doc (Use email as ID or let Firestore generate it)
                    await addDoc(collection(db, 'users'), {
                        email: email,
                        role: 'local_admin',
                        areaId: areaId,
                        status: status,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
                closeAdminModal();
                alert('✅ บันทึกข้อมูลแอดมินเรียบร้อย');
            } catch (e) {
                console.error("Error saving admin:", e);
                alert("❌ เกิดข้อผิดพลาด: " + e.message);
            }
        };

        window.deleteAdmin = async (id) => {
            if (!confirm('ยืนยันการลบบัญชีแอดมินนี้?')) return;
            try {
                await deleteDoc(doc(db, 'users', id));
            } catch (e) {
                console.error("Error deleting admin:", e);
                alert("❌ เกิดข้อผิดพลาด: " + e.message);
            }
        };

        // --- MOCK DATA FUNCTION ---
        window.seedMockData = async () => {
            if(!confirm("ต้องการเพิ่มข้อมูลจำลองสำหรับ Area และ Admin หรือไม่?")) return;
            try {
                const area1 = await addDoc(collection(db, 'areas'), { name: "ภาคเหนือ (เชียงใหม่)", technicianPin: "1234", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                const area2 = await addDoc(collection(db, 'areas'), { name: "ภาคกลาง (กรุงเทพฯ)", technicianPin: "5678", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                
                await addDoc(collection(db, 'users'), { email: "admin.north@example.com", role: "local_admin", areaId: area1.id, status: "active", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                await addDoc(collection(db, 'users'), { email: "admin.bkk@example.com", role: "local_admin", areaId: area2.id, status: "active", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                
                alert('✅ เพิ่มข้อมูลจำลองสำเร็จ!');
            } catch(e) {
                alert('❌ ผิดพลาด: ' + e.message);
            }
        };

        // Populate Local Admins Table
        let areaMap = {}; // Cache for area names
        onSnapshot(query(collection(db, 'users'), where('role', '==', 'local_admin')), snap => {
            const body = document.getElementById('localAdminTableBody');
            if (!body) return;
            if (snap.empty) {
                body.innerHTML = '<tr><td colspan="5" class="py-10 text-center font-black text-slate-300 dark:text-slate-600 italic text-xs uppercase tracking-widest">ยังไม่มีข้อมูลแอดมินสาขา...</td></tr>';
                return;
            }
            body.innerHTML = '';
            snap.forEach(documentSnapshot => {
                const data = documentSnapshot.data();
                const tr = document.createElement('tr');
                tr.classList.add('hover:bg-slate-50', 'dark:hover:bg-slate-800', 'dark:bg-slate-900/50', 'border-b', 'border-slate-50', 'dark:border-slate-800/80', 'last:border-0', 'transition-all');
                
                const areaName = areaMap[data.areaId] || data.areaId || 'ไม่ระบุ';
                const isSuspended = data.status === 'suspended';

                tr.innerHTML = \`
                    <td class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">\${documentSnapshot.id.substring(0,8)}</td>
                    <td class="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">\${data.email || 'No Email'}</td>
                    <td class="py-4 px-6 font-bold text-indigo-600 dark:text-indigo-400">\${areaName}</td>
                    <td class="py-4 px-6">
                        <span class="px-2.5 py-1 \${!isSuspended ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'} rounded-lg text-[9px] font-black uppercase tracking-wider border italic">
                            \${!isSuspended ? '🟢 ACTIVE' : '🔴 SUSPENDED'}
                        </span>
                    </td>
                    <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button onclick="openEditAdminModal('\${documentSnapshot.id}', '\${data.email || ''}', '\${data.areaId || ''}', '\${data.status || 'active'}')" class="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                            <button onclick="deleteAdmin('\${documentSnapshot.id}')" class="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                    </td>
                \`;
                body.appendChild(tr);
            });
        });
`;

// Insert the JS logic right before the areas listener so areaMap can be updated
content = content.replace("onSnapshot(query(collection(db, 'areas'), orderBy('updatedAt', 'desc')), snap => {", 
    jsLogic + "\n        onSnapshot(query(collection(db, 'areas'), orderBy('updatedAt', 'desc')), snap => {");

// We need to update areaMap and the dropdown inside the area listener
const areaMapLogic = `
            areaMap = {};
            const adminAreaSelect = document.getElementById('adminAreaId');
            if(adminAreaSelect) adminAreaSelect.innerHTML = '<option value="">-- เลือกพื้นที่ --</option>';

            snap.forEach(documentSnapshot => {
                const data = documentSnapshot.data();
                areaMap[documentSnapshot.id] = data.name;
                if(adminAreaSelect) {
                    adminAreaSelect.innerHTML += \`<option value="\${documentSnapshot.id}">\${data.name}</option>\`;
                }
`;

content = content.replace("snap.forEach(documentSnapshot => {", areaMapLogic);

fs.writeFileSync('super_admin.html', content);
