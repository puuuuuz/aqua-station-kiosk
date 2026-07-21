const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

// Upgrade Dark Mode Colors to deep Slate-950
content = content.replace(/dark:bg-slate-900/g, 'dark:bg-slate-950');
content = content.replace(/dark:bg-slate-800/g, 'dark:bg-slate-900');
content = content.replace(/dark:border-slate-700/g, 'dark:border-slate-800');
content = content.replace(/dark:hover:bg-slate-700/g, 'dark:hover:bg-slate-800');
content = content.replace(/dark:bg-slate-950\/50/g, 'dark:bg-slate-900/50'); // fix over-replaced hover
content = content.replace(/dark:text-white/g, 'dark:text-slate-100'); // Softer white text

fs.writeFileSync('super_admin.html', content);
console.log('Dark mode v2 refined successfully.');
