const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const injectionPoint = '/* Water Full Pulse */';
    const newStyles = `/* Dark Mode Leaflet Popup Overrides */
        .dark .leaflet-popup-content-wrapper,
        .dark .leaflet-popup-tip {
            background-color: #0f172a; /* slate-900 */
            color: #f1f5f9; /* slate-100 */
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }
        .dark .leaflet-popup-close-button {
            color: #94a3b8 !important; /* slate-400 */
        }
        .dark .leaflet-popup-close-button:hover {
            color: #f8fafc !important; /* slate-50 */
        }
        
        /* Water Full Pulse */`;

    if (content.includes(injectionPoint)) {
        if (!content.includes('Dark Mode Leaflet Popup Overrides')) {
            content = content.replace(injectionPoint, newStyles);
            fs.writeFileSync(file, content);
            console.log('Successfully added dark mode styles for leaflet popup');
        } else {
            console.log('Styles already exist.');
        }
    } else {
        console.log('Injection point not found.');
    }
}
