const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // 1. startDispensing loop
    code = code.replace(/sendPacket\(0xC6,\s*0x53,\s*\[0x00,\s*0x64\],\s*'PUMP-START'\);/g, "sendPacket(0xC6, 0x53, [bHi, bLo], 'PUMP-START');");
    
    // 2. sendContinuousStart
    code = code.replace(/sendPacket\(0xC6,\s*0x53,\s*\[0x00,\s*0x64\],\s*'START-CONT-PUMP'\);/g, "sendPacket(0xC6, 0x53, [fsHi, fsLo], 'START-CONT-PUMP');");
    
    // 3. forceStartAll
    code = code.replace(/sendPacket\(0xC6,\s*0x53,\s*\[0x00,\s*100\],\s*'FORCE-PUMP'\);/g, "sendPacket(0xC6, 0x53, [0x02, 0x3A], 'FORCE-PUMP');");
    
    // 4. testTotalHardware
    code = code.replace(/const pC6 = buildPacket\(0xC6,\s*0x53,\s*\[0x00,\s*0x64\]\);/g, "const pC6 = buildPacket(0xC6, 0x53, pulseData);");
    
    fs.writeFileSync(file, code);
    console.log(`Patched ${file}`);
});
