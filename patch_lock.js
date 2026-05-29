const fs = require('fs');
const files = ['station-v121.html', 'tablet-kiosk.html', 'tablet-sync-670.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // 1. Update the lock check
    const checkTarget1 = "if (lockAge < 3 * 60 * 1000) { // 3 นาที";
    const checkTarget2 = "if (lockAge < 3 * 60 * 1000) {";
    
    const checkInject = `const lockedBy = userData.lockedByMachine || 'Unknown';
                    const currentDevice = typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown_Current';
                    if (lockAge < 3 * 60 * 1000 && lockedBy !== currentDevice) { // 3 นาที and NOT this machine`;
                    
    if (code.includes(checkTarget1) && !code.includes('lockedBy !== currentDevice')) {
        code = code.replace(checkTarget1, checkInject);
    } else if (code.includes(checkTarget2) && !code.includes('lockedBy !== currentDevice')) {
        code = code.replace(checkTarget2, checkInject);
    }
    
    // 2. Add lockedByMachine to the lock creation (Phone Login)
    const createTarget1 = `isDispensing: true,
                        lockTime: Date.now()`;
    const createInject1 = `isDispensing: true,
                        lockTime: Date.now(),
                        lockedByMachine: typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'Unknown'`;
    if (code.includes(createTarget1)) {
        code = code.split(createTarget1).join(createInject1);
    }
    
    // 3. Add lockedByMachine to the deleteField
    const deleteTarget1 = `isDispensing: window.deleteField(),
                                        lockTime: window.deleteField()`;
    const deleteInject1 = `isDispensing: window.deleteField(),
                                        lockTime: window.deleteField(),
                                        lockedByMachine: window.deleteField()`;
    if (code.includes(deleteTarget1)) {
        code = code.split(deleteTarget1).join(deleteInject1);
    }
    
    const deleteTarget2 = `isDispensing: window.deleteField(),
                                lockTime: window.deleteField()`;
    const deleteInject2 = `isDispensing: window.deleteField(),
                                lockTime: window.deleteField(),
                                lockedByMachine: window.deleteField()`;
    if (code.includes(deleteTarget2)) {
        code = code.split(deleteTarget2).join(deleteInject2);
    }

    fs.writeFileSync(file, code);
    console.log(`Patched lock logic in ${file}`);
});
