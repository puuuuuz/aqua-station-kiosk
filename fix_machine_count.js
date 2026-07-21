const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove the misplaced machineCount definition
    const misplacedDefinition = "const machineCount = (typeof allMachines !== 'undefined') ? allMachines.filter(m => m.areaId === documentSnapshot.id).length : 0;";
    content = content.replace(misplacedDefinition, "");

    // Add it to the correct place in the areaTableBody loop
    const targetHtml = `// Add to areaMap and dropdown\n                areaMap[documentSnapshot.id] = data.name;`;
    if (content.includes(targetHtml)) {
        content = content.replace(
            targetHtml,
            `// Add to areaMap and dropdown\n                const machineCount = (typeof allMachines !== 'undefined') ? allMachines.filter(m => m.areaId === documentSnapshot.id).length : 0;\n                areaMap[documentSnapshot.id] = data.name;`
        );
        fs.writeFileSync(file, content);
        console.log('Fixed machineCount reference error in ' + file);
    } else {
        console.log('Could not find target html');
    }
}
