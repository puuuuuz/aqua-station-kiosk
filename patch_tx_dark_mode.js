const fs = require('fs');

const filesToPatch = [
    'super_admin.html',
    'admin.html'
];

for (const file of filesToPatch) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Add dark mode support to the machine name in the report table
    content = content.replace(
        /class="font-black text-slate-950 text-sm italic leading-none"/g,
        'class="font-black text-slate-950 dark:text-slate-100 text-sm italic leading-none"'
    );
    
    // Check if there are other text-slate-950 that need dark:text-slate-100
    // Example: the Volume "L" part!
    // <td class="py-4 px-6 align-middle whitespace-nowrap font-black text-slate-900 dark:text-slate-100 tabular-nums text-base"> 
    // This looks like it already has dark:text-slate-100, but let's make sure.

    fs.writeFileSync(file, content);
}
