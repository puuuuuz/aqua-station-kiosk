const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

// Fix Map Modal Container
content = content.replace(/id="mapKioskPanel" class="([^"]*)bg-slate-900\/95([^"]*)"/g, 
  'id="mapKioskPanel" class="$1bg-white/95 dark:bg-slate-900/95$2"');
  
// Fix text-white inside Modal Header to support light mode
content = content.replace(/text-xs font-black text-white uppercase tracking-widest/g, 
  'text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest');
content = content.replace(/text-white\/40 hover:text-white/g, 
  'text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white');

// Fix Search Input
content = content.replace(/class="([^"]*)text-white text-xs([^"]*)"/g, (match, p1, p2) => {
    if(match.includes('mapSearchBox')) {
        return `class="${p1}text-slate-900 dark:text-white text-xs${p2}"`;
    }
    return match;
});

// Fix JavaScript generation for map list items
content = content.replace(/mapCard.className = "([^"]*)text-white\/90([^"]*)";/g, 
  'mapCard.className = "$1text-slate-900 dark:text-white/90$2";');
  
// Actually, the text-white/90 was in innerHTML:
content = content.replace(/<div class="flex items-center gap-2.5 text-white\/90 flex-1 overflow-hidden"/g, 
  '<div class="flex items-center gap-2.5 text-slate-900 dark:text-white/90 flex-1 overflow-hidden"');

// Fix the map loading text
content = content.replace(/text-white\/20 font-black italic/g, 
  'text-slate-400 dark:text-white/20 font-black italic');

fs.writeFileSync('super_admin.html', content);
