const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace allMachines with latestMachines
    content = content.replace(/allMachines/g, 'latestMachines');

    fs.writeFileSync(file, content);
    console.log('Replaced allMachines with latestMachines');
}
