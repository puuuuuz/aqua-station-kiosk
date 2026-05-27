import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');
const lines = content.split('\n');

function printFunc(name) {
    let func = '';
    let inFunc = false;
    let braceCount = 0;
    for (const line of lines) {
        if (line.includes(`function ${name}`)) {
            inFunc = true;
        }
        if (inFunc) {
            func += line + '\n';
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount === 0 && func.includes('{')) {
                break;
            }
        }
    }
    console.log(`--- ${name} ---`);
    console.log(func);
}

printFunc('handleStandbyClick');
printFunc('startDispensing');
