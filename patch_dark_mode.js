const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

const replacements = [
    { regex: /(?<!dark:)\bbg-white\b/g, replacement: 'bg-white dark:bg-slate-800 dark:border-slate-700' },
    { regex: /(?<!dark:)\bbg-slate-50\b/g, replacement: 'bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800' },
    { regex: /(?<!dark:)\btext-slate-900\b/g, replacement: 'text-slate-900 dark:text-white' },
    { regex: /(?<!dark:)\btext-slate-800\b/g, replacement: 'text-slate-800 dark:text-slate-200' },
    { regex: /(?<!dark:)\btext-slate-700\b/g, replacement: 'text-slate-700 dark:text-slate-300' },
    { regex: /(?<!dark:)\btext-slate-600\b/g, replacement: 'text-slate-600 dark:text-slate-400' },
    { regex: /(?<!dark:)\btext-slate-500\b/g, replacement: 'text-slate-500 dark:text-slate-400' },
    { regex: /(?<!dark:)\bborder-slate-100\b/g, replacement: 'border-slate-100 dark:border-slate-700' },
    { regex: /(?<!dark:)\bborder-slate-200\b/g, replacement: 'border-slate-200 dark:border-slate-600' },
    { regex: /(?<!dark:)\bdivide-slate-100\b/g, replacement: 'divide-slate-100 dark:divide-slate-700' },
    { regex: /(?<!dark:)\bhover:bg-slate-50\b/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-700' },
    { regex: /(?<!dark:)\bshadow-sm\b/g, replacement: 'shadow-sm dark:shadow-none' },
    { regex: /(?<!dark:)\bshadow-md\b/g, replacement: 'shadow-md dark:shadow-none' },
    { regex: /(?<!dark:)\bshadow-lg\b/g, replacement: 'shadow-lg dark:shadow-none' },
    { regex: /(?<!dark:)\bshadow-xl\b/g, replacement: 'shadow-xl dark:shadow-none' },
    { regex: /(?<!dark:)\bshadow-inner\b/g, replacement: 'shadow-inner dark:shadow-none' },
    // Fix specific conflicting items we already touched like body, main, header manually so they don't double up
];

replacements.forEach(({regex, replacement}) => {
    content = content.replace(regex, replacement);
});

// Remove doubled classes caused by running on elements that already had dark variants manually added
content = content.replace(/dark:bg-slate-900 dark:bg-slate-800/g, 'dark:bg-slate-900');
content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
content = content.replace(/dark:border-slate-800 dark:border-slate-700/g, 'dark:border-slate-800');

fs.writeFileSync('super_admin.html', content);
console.log('Dark mode classes injected successfully.');
