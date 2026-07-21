const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const adminBtn = `<button onclick="switchPage('local_admins', 'จัดการแอดมินสาขา')" class="nav-item w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group">
                    <svg class="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                    <span class="font-bold text-[14px]">จัดการแอดมินสาขา</span>
                </button>`;
                
    const usersBtn = `<button onclick="switchPage('users', 'ข้อมูลสมาชิก')" class="nav-item w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group">
                    <svg class="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                    <span class="font-bold text-[14px] whitespace-nowrap">ข้อมูลสมาชิก</span>
                </button>`;

    // Remove buttons from original places
    content = content.replace(adminBtn + '\n', '');
    content = content.replace(usersBtn + '\n', '');
    
    // In case newline is slightly different
    content = content.replace(adminBtn, '');
    content = content.replace(usersBtn, '');

    // Add new section after map button
    const mapBtn = `<button onclick="switchPage('map', 'แผนที่ตู้กดน้ำ')" class="nav-item w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group">
                    <svg class="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round"/></svg>
                    <span class="font-bold text-[14px]">แผนที่ตู้กดน้ำ</span>
                </button>`;
                
    const newSection = `${mapBtn}

                <div class="px-4 py-6 text-[9px] font-black uppercase tracking-[2px] text-slate-600 dark:text-slate-400">จัดการผู้ใช้งาน</div>
                ${adminBtn}
                ${usersBtn}`;

    content = content.replace(mapBtn, newSection);

    fs.writeFileSync(file, content);
    console.log("✅ Sidebar reorganized successfully.");
} else {
    console.error("File not found:", file);
}
