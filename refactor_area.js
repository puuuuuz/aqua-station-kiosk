const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

// 1. Remove Mock Data buttons
content = content.replace('<div class="flex gap-3 mb-4"><button onclick="openAddAreaModal()" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างพื้นที่ใหม่</button><button onclick="seedMockData()" class="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all">✨ เพิ่มข้อมูลจำลอง (Mock Data)</button></div>', '<button onclick="openAddAreaModal()" class="mb-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างพื้นที่ใหม่</button>');
content = content.replace('<div class="flex gap-3 mb-4"><button onclick="openAddAdminModal()" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างบัญชีแอดมิน</button><button onclick="seedMockData()" class="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all">✨ เพิ่มข้อมูลจำลอง (Mock Data)</button></div>', '<button onclick="openAddAdminModal()" class="mb-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างบัญชีแอดมิน</button>');

// 2. Remove seedMockData function from JS
content = content.replace(/\/\/ --- MOCK DATA FUNCTION ---[\s\S]*?window\.seedMockData = async \(\) => \{[\s\S]*?\};\n/, '');

// 3. Refactor Area Modal HTML to use 3 Dropdowns instead of text input
const oldAreaNameInput = `<div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ชื่อพื้นที่ (Area Name)</label>
                    <input type="text" id="areaName" placeholder="เช่น กรุงเทพมหานคร" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
                </div>`;

const newAreaDropdowns = `
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">จังหวัด (Province)</label>
                    <select id="areaProv" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all"><option value="">-- เลือกจังหวัด --</option></select>
                </div>
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">อำเภอ/เขต (District)</label>
                    <select id="areaDist" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all" disabled><option value="">-- เลือกอำเภอ --</option></select>
                </div>
                <div class="space-y-1">
                    <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">ตำบล/แขวง (Sub-district)</label>
                    <select id="areaSub" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all" disabled><option value="">-- เลือกตำบล --</option></select>
                </div>
`;
content = content.replace(oldAreaNameInput, newAreaDropdowns);

// 4. Update saveArea JS logic to use Dropdowns and matching IDs
const oldAreaJSLogic = `window.openAddAreaModal = () => {
            document.getElementById('areaIdInput').value = '';
            document.getElementById('areaNameInput').value = '';
            document.getElementById('areaPinInput').value = '';
            document.getElementById('areaModalTitle').innerText = 'เพิ่มพื้นที่ใหม่';
            document.getElementById('areaModal').classList.remove('hidden');
        };

        window.openEditAreaModal = (id, name, pin) => {
            document.getElementById('areaIdInput').value = id;
            document.getElementById('areaNameInput').value = name;
            document.getElementById('areaPinInput').value = pin;
            document.getElementById('areaModalTitle').innerText = 'แก้ไขพื้นที่';
            document.getElementById('areaModal').classList.remove('hidden');
        };

        window.closeAreaModal = () => {
            document.getElementById('areaModal').classList.add('hidden');
        };

        window.saveArea = async () => {
            const id = document.getElementById('areaIdInput').value;
            const name = document.getElementById('areaNameInput').value.trim();
            const pin = document.getElementById('areaPinInput').value.trim();
            
            if(!name || pin.length < 4) {
                alert('กรุณากรอกชื่อพื้นที่ และ PIN (อย่างน้อย 4 หลัก)');
                return;
            }

            const btn = document.getElementById('saveAreaBtn');
            btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            btn.disabled = true;

            try {
                if (id) {
                    await updateDoc(doc(db, 'areas', id), {
                        name: name,
                        technicianPin: pin,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    await addDoc(collection(db, 'areas'), {
                        name: name,
                        technicianPin: pin,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
                closeAreaModal();
            } catch(e) {
                console.error(e);
                alert('เกิดข้อผิดพลาดในการบันทึกพื้นที่');
            }
            
            btn.innerHTML = 'บันทึกพื้นที่';
            btn.disabled = false;
        };`;

// Note: I will use regex to catch the old block safely.
// Let's create the replacement logic block.
const newAreaJSLogic = `
        // Init Thailand Address Dropdowns
        const initAddressDropdowns = () => {
            const provSelect = document.getElementById('areaProv');
            const distSelect = document.getElementById('areaDist');
            const subSelect = document.getElementById('areaSub');
            
            provSelect.innerHTML = '<option value="">-- เลือกจังหวัด --</option>';
            ThailandAddressLib.getProvinces().forEach(p => provSelect.innerHTML += \`<option value="\${p}">\${p}</option>\`);
            
            provSelect.onchange = () => {
                const prov = provSelect.value;
                distSelect.innerHTML = '<option value="">-- เลือกอำเภอ --</option>';
                subSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
                subSelect.disabled = true;
                if(prov) {
                    distSelect.disabled = false;
                    ThailandAddressLib.getDistricts(prov).forEach(d => distSelect.innerHTML += \`<option value="\${d}">\${d}</option>\`);
                } else {
                    distSelect.disabled = true;
                }
            };
            
            distSelect.onchange = () => {
                const prov = provSelect.value;
                const dist = distSelect.value;
                subSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
                if(dist) {
                    subSelect.disabled = false;
                    ThailandAddressLib.getSubDistricts(prov, dist).forEach(s => subSelect.innerHTML += \`<option value="\${s}">\${s}</option>\`);
                } else {
                    subSelect.disabled = true;
                }
            };
        };

        window.openAddAreaModal = () => {
            document.getElementById('editAreaId').value = '';
            document.getElementById('areaProv').value = '';
            document.getElementById('areaDist').value = '';
            document.getElementById('areaDist').disabled = true;
            document.getElementById('areaSub').value = '';
            document.getElementById('areaSub').disabled = true;
            document.getElementById('areaPin').value = '';
            document.getElementById('areaModalTitle').innerText = 'เพิ่มพื้นที่ใหม่';
            
            initAddressDropdowns();
            document.getElementById('areaModal').classList.remove('hidden');
        };

        window.openEditAreaModal = (id, name, pin) => {
            document.getElementById('editAreaId').value = id;
            document.getElementById('areaPin').value = pin;
            
            // Name format from DB is typically "ต.sub อ.dist จ.prov"
            // But we will re-initialize dropdowns and let user re-select if editing, or we can parse it.
            // Parsing "ต.xxx อ.yyy จ.zzz"
            initAddressDropdowns();
            
            const provSelect = document.getElementById('areaProv');
            const distSelect = document.getElementById('areaDist');
            const subSelect = document.getElementById('areaSub');
            
            let provMatch = name.match(/จ\\.(.+)$/);
            let distMatch = name.match(/อ\\.(.+?)\\s+จ\\./);
            let subMatch = name.match(/ต\\.(.+?)\\s+อ\\./);
            
            if(provMatch) {
                provSelect.value = provMatch[1];
                provSelect.onchange(); // trigger district load
                if(distMatch) {
                    distSelect.value = distMatch[1];
                    distSelect.onchange(); // trigger sub load
                    if(subMatch) {
                        subSelect.value = subMatch[1];
                    }
                }
            }
            
            document.getElementById('areaModalTitle').innerText = 'แก้ไขพื้นที่';
            document.getElementById('areaModal').classList.remove('hidden');
        };

        window.closeAreaModal = () => {
            document.getElementById('areaModal').classList.add('hidden');
        };

        window.saveArea = async () => {
            const id = document.getElementById('editAreaId').value;
            const prov = document.getElementById('areaProv').value;
            const dist = document.getElementById('areaDist').value;
            const sub = document.getElementById('areaSub').value;
            const pin = document.getElementById('areaPin').value.trim();
            
            if(!prov || !dist || !sub || pin.length < 4) {
                alert('กรุณาเลือกพื้นที่ให้ครบถ้วน และกำหนด PIN อย่างน้อย 4 หลัก');
                return;
            }
            
            const name = \`ต.\${sub} อ.\${dist} จ.\${prov}\`;

            try {
                if (id) {
                    await updateDoc(doc(db, 'areas', id), {
                        name: name,
                        technicianPin: pin,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    await addDoc(collection(db, 'areas'), {
                        name: name,
                        technicianPin: pin,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
                closeAreaModal();
            } catch(e) {
                console.error(e);
                alert('เกิดข้อผิดพลาดในการบันทึกพื้นที่');
            }
        };`;

// Replace the old block
// I'll read from `window.openAddAreaModal = () => {` until the end of `window.saveArea = async () => { ... }`
// The `saveArea` ends with `btn.disabled = false; };`
content = content.replace(/window\.openAddAreaModal = \(\) => \{[\s\S]*?btn\.disabled = false;\n        \};/, newAreaJSLogic);

fs.writeFileSync('super_admin.html', content);
