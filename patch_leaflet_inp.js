const fs = require('fs');

const filesToPatch = [
    'super_admin.html',
    'admin.html'
];

for (const file of filesToPatch) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Find the L.map('mapCanvas', { ... }) block and inject performance options
    const target = "map = L.map('mapCanvas', {";
    if (content.includes(target) && !content.includes('preferCanvas: true')) {
        content = content.replace(
            target,
            "map = L.map('mapCanvas', {\n                preferCanvas: true,\n                markerZoomAnimation: false,\n                wheelDebounceTime: 150,"
        );
        fs.writeFileSync(file, content);
        console.log('Patched ' + file);
    }
}
