const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix Report Filter Layout
    const targetFilterDiv = `<div class="flex-1 min-w-[180px]">
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกตู้กดน้ำ</label>
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกพื้นที่</label>
                        <select id="reportAreaFilter" onchange="filterReports()" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all appearance-none cursor-pointer mb-4">
                            <option value="all">🌍 ทุกพื้นที่</option>
                        </select>
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกตู้กดน้ำ</label>
                        <select id="reportMachineFilter" onchange="filterReports()" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all appearance-none cursor-pointer">
                            <option value="all">✓ ตู้ทั้งหมด</option>
                        </select>
                    </div>`;

    const replaceFilterDiv = `<div class="flex-1 min-w-[150px]">
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกพื้นที่</label>
                        <select id="reportAreaFilter" onchange="filterReports()" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all appearance-none cursor-pointer">
                            <option value="all">🌍 ทุกพื้นที่</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block">เลือกตู้กดน้ำ</label>
                        <select id="reportMachineFilter" onchange="filterReports()" class="w-full bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all appearance-none cursor-pointer">
                            <option value="all">✓ ตู้ทั้งหมด</option>
                        </select>
                    </div>`;
                    
    content = content.replace(targetFilterDiv, replaceFilterDiv);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed Report Filter Layout");
} else {
    console.error("File not found:", file);
}
