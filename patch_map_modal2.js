const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add Area filter dropdown to Map Search Modal
    const targetMapSearch = `<input type="text" id="mapSearchBox" placeholder="ค้นหา ID หรือ ชื่อตู้..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-5 text-white text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all">`;
    const replaceMapSearch = `<select id="mapAreaFilter" onchange="filterMapList()" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-5 text-slate-700 dark:text-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer mb-3">
                                <option value="all">🌍 ทุกเทศบาล/พื้นที่</option>
                            </select>
                            <input type="text" id="mapSearchBox" oninput="filterMapList()" placeholder="ค้นหา ID หรือ ชื่อตู้..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-5 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all">`;
    content = content.replace(targetMapSearch, replaceMapSearch);

    // 2. Add filterMapList function
    const targetFilterFn = `// 🛰️ MASTER MARKER SYNC FUNCTION (Optimized: Filters Offline & Handles Collisions)`;
    const replaceFilterFn = `window.filterMapList = () => {
            const term = (document.getElementById('mapSearchBox')?.value || '').toLowerCase();
            const area = document.getElementById('mapAreaFilter')?.value || 'all';
            const mapOverlay = document.getElementById('mapKioskList');
            if (!mapOverlay) return;
            const cards = mapOverlay.children;
            for (let i = 0; i < cards.length; i++) {
                const c = cards[i];
                if (!c.dataset.search) continue;
                const matchT = !term || c.dataset.search.includes(term);
                const matchA = area === 'all' || c.dataset.area === area;
                c.style.display = matchT && matchA ? 'flex' : 'none';
            }
        };

        // 🛰️ MASTER MARKER SYNC FUNCTION (Optimized: Filters Offline & Handles Collisions)`;
    content = content.replace(targetFilterFn, replaceFilterFn);

    // 3. Add data attributes to map cards
    const targetMapCardClass = `mapCard.className = "p-3.5 bg-white dark:bg-slate-900 dark:border-slate-800/10 hover:bg-white dark:bg-slate-900 dark:border-slate-800/20 border border-white/5 rounded-xl transition-all cursor-pointer group flex items-center justify-between";`;
    const replaceMapCardClass = `mapCard.className = "p-3.5 bg-white dark:bg-slate-900 dark:border-slate-800/10 hover:bg-white dark:bg-slate-900 dark:border-slate-800/20 border border-white/5 rounded-xl transition-all cursor-pointer group flex items-center justify-between";
                    mapCard.dataset.search = \`\${dev.id} \${dev.name || ''}\`.toLowerCase();
                    mapCard.dataset.area = dev.areaId || '';`;
    content = content.replace(targetMapCardClass, replaceMapCardClass);

    // 4. Populate mapAreaSelect
    const targetAreaSelect1 = `const adminAreaSelect = document.getElementById('adminAreaId');`;
    const replaceAreaSelect1 = `const adminAreaSelect = document.getElementById('adminAreaId');
            const mapAreaSelect = document.getElementById('mapAreaFilter');
            if(mapAreaSelect) mapAreaSelect.innerHTML = '<option value="all">🌍 ทุกเทศบาล/พื้นที่</option>';`;
    content = content.replace(targetAreaSelect1, replaceAreaSelect1);
    
    const targetAreaSelect2 = `if(adminAreaSelect) {
                    adminAreaSelect.innerHTML += \`<option value="\${documentSnapshot.id}">\${data.name}</option>\`;
                }`;
    const replaceAreaSelect2 = `if(adminAreaSelect) {
                    adminAreaSelect.innerHTML += \`<option value="\${documentSnapshot.id}">\${data.name}</option>\`;
                }
                if(mapAreaSelect) {
                    mapAreaSelect.innerHTML += \`<option value="\${documentSnapshot.id}">\${data.name}</option>\`;
                }`;
    content = content.replace(targetAreaSelect2, replaceAreaSelect2);
                
    // 5. Fix Offline Icon Color logic in Map Kiosk List
    const targetMapIconColor = `<span class="w-1.5 h-1.5 rounded-full flex-shrink-0 \${dev.status === 'hardware_offline' ? 'bg-fuchsia-600 animate-pulse shadow-[0_0_8px_rgba(192,38,211,1)]' : (dev.water_empty ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)]' : (dev.producing_water ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,1)]' : (dev.no_tap_water ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]' : (isDispensing ? 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,1)]' : (dev.water_full ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]' : (isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-white dark:bg-slate-900 dark:border-slate-800/20'))))))}"></span>`;
    const replaceMapIconColor = `<span class="w-1.5 h-1.5 rounded-full flex-shrink-0 \${!isOnline ? 'bg-slate-300 dark:bg-slate-600' : (dev.status === 'hardware_offline' ? 'bg-fuchsia-600 animate-pulse shadow-[0_0_8px_rgba(192,38,211,1)]' : (dev.water_empty ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)]' : (dev.producing_water ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,1)]' : (dev.no_tap_water ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]' : (isDispensing ? 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,1)]' : (dev.water_full ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]'))))))}"></span>`;
    content = content.replace(targetMapIconColor, replaceMapIconColor);

    fs.writeFileSync(file, content);
    console.log("✅ Map Modal Patched successfully!");
} else {
    console.error("File not found:", file);
}
