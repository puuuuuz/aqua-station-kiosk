const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

content = content.replace(/bg-emerald-50(?!\/|0)/g, 'bg-emerald-50 dark:bg-emerald-500/10');
content = content.replace(/text-emerald-600/g, 'text-emerald-600 dark:text-emerald-400');
content = content.replace(/border-emerald-100(?!\/|0)/g, 'border-emerald-100 dark:border-emerald-500/20');

content = content.replace(/bg-indigo-50(?!\/|0)/g, 'bg-indigo-50 dark:bg-indigo-500/10');
content = content.replace(/text-indigo-600/g, 'text-indigo-600 dark:text-indigo-400');
content = content.replace(/border-indigo-100(?!\/|0)/g, 'border-indigo-100 dark:border-indigo-500/20');

content = content.replace(/bg-rose-50(?!\/|0)/g, 'bg-rose-50 dark:bg-rose-500/10');
content = content.replace(/text-rose-600/g, 'text-rose-600 dark:text-rose-400');
content = content.replace(/border-rose-100(?!\/|0)/g, 'border-rose-100 dark:border-rose-500/20');

content = content.replace(/bg-slate-100(?!\/|0)/g, 'bg-slate-100 dark:bg-slate-800');
content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');

fs.writeFileSync('super_admin.html', content);
