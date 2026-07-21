const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // FIX 1: Dashboard Table (Remove gray header, add padding to card)
    const oldDashTable = `<!-- MAIN KIOSK MANAGEMENT TABLE (Now on Dashboard) -->
                <div class="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden leading-relaxed">
                    <div class="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800/30">
                        <h3 class="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase tracking-widest text-[11px]">รายการตู้น้ำในเครือข่าย</h3>
                    </div>
                    <div class="overflow-x-auto">`;
                    
    const newDashTable = `<!-- MAIN KIOSK MANAGEMENT TABLE (Now on Dashboard) -->
                <div class="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden leading-relaxed px-8 py-5">
                    <h3 class="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase tracking-widest text-[11px] mb-4">รายการตู้น้ำในเครือข่าย</h3>
                    <div class="overflow-x-auto">`;

    if (content.includes(oldDashTable)) {
        content = content.replace(oldDashTable, newDashTable);
    }

    // FIX 2: Devices Tab Table (Remove gray header, add external title and padding to card)
    const oldDevicesTable = `<!-- SECTION: DEVICES (Alias to Dashboard for now to keep ID alive) -->
            <div id="section-devices" class="page-section space-y-6">
                <!-- Data is mirrored from Dashboard main view -->
                <div class="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden leading-relaxed mt-6">
                    <div class="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800/30">
                        <h3 class="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase tracking-widest text-[11px]">รายการตู้น้ำในเครือข่ายทั้งหมด</h3>
                    </div>
                    <div class="overflow-x-auto">`;
                    
    const newDevicesTable = `<!-- SECTION: DEVICES (Alias to Dashboard for now to keep ID alive) -->
            <div id="section-devices" class="page-section space-y-6">
                <div class="flex flex-col gap-1 mt-6 px-4">
                    <h2 class="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-short">จัดการตู้น้ำ (Devices)</h2>
                    <p class="text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium text-sm">รายการตู้น้ำทั้งหมดในเครือข่าย</p>
                </div>
                <!-- Data is mirrored from Dashboard main view -->
                <div class="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden leading-relaxed px-8 py-5 mx-4">
                    <div class="overflow-x-auto">`;

    if (content.includes(oldDevicesTable)) {
        content = content.replace(oldDevicesTable, newDevicesTable);
    }
    
    // There was an issue in screenshot 1 where the background of the thead was white because it might not be applying bg-slate-50 correctly?
    // Wait, let's also remove the redundant rounded corners if there are any.
    // Let's make sure the thead classes are the same as Areas tab.
    // Areas: class="bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-[2px] border-b border-slate-100 dark:border-slate-800"
    // Devices: class="bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-[2px] border-b border-slate-100 dark:border-slate-800"
    // They are exactly the same.
    // The only difference was the container having padding!

    fs.writeFileSync(file, content);
    console.log('Fixed table container layouts');
}
