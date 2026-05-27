import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf8');

// The block to remove:
/*
        (function () {
            const VERSION = "2.25";
            const params = new URLSearchParams(window.location.search);
            if (params.get('v') !== VERSION) {
                params.set('v', VERSION);
                params.set('t', Date.now());
                window.location.search = params.toString();
            }
        })();
*/

content = content.replace(/\(function \(\) \{\s*const VERSION = "[0-9.]+";\s*const params = new URLSearchParams\(window\.location\.search\);\s*if \(params\.get\('v'\) !== VERSION\) \{\s*params\.set\('v', VERSION\);\s*params\.set\('t', Date\.now\(\)\);\s*window\.location\.search = params\.toString\(\);\s*\}\s*\}\)\(\);/, 'console.log("Cache buster removed for Capacitor compatibility");');

fs.writeFileSync('station-v121.html', content, 'utf8');
console.log("Cache buster removed successfully!");
