const fs = require('fs');

const filesToPatch = ['admin.html', 'super_admin.html'];

for (const file of filesToPatch) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add abort mechanism to loadVolChart
    if (!content.includes('let chartRenderCounter = 0;')) {
        content = content.replace('async function loadVolChart() {', 'let chartRenderCounter = 0;\n        async function loadVolChart() {\n            const currentRender = ++chartRenderCounter;');
        content = content.replace('if (volChartInstance) volChartInstance.destroy();', 'if (currentRender !== chartRenderCounter) return;\n            if (volChartInstance) volChartInstance.destroy();');
    }

    // 2. Fix Grid Colors to use standard transparent colors so they are always faint
    content = content.replace("const gridColor = isDark ? '#1e293b' : '#f1f5f9';", "const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';");
    
    fs.writeFileSync(file, content);
}
