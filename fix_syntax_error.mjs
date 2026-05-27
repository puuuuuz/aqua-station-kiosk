import { readFileSync, writeFileSync } from 'fs';

const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');

        // Replace the second "let allowedQRLimit = 2.0;" block with just assigning allowedQRLimit
        // (Removing the duplicate "let" keyword to eliminate the SyntaxError!)
        const targetOld = `// 🛡️ DYNAMIC QR HARD CAP (SAFE ROLLBACK BASE):
                                    // Allows user-specific quota limit (e.g. 192.00L) to pass safely!
                                    let allowedQRLimit = 2.0;`;
                                    
        const targetNew = `// 🛡️ DYNAMIC QR HARD CAP (SAFE ROLLBACK BASE):
                                    // Allows user-specific quota limit (e.g. 192.00L) to pass safely!
                                    allowedQRLimit = 2.0;`;
                                    
        if (content.includes(targetOld)) {
            content = content.replace(targetOld, targetNew);
            console.log(`✅ Fixed duplicate let declaration syntax error in ${file}`);
        }

        writeFileSync(file, content, 'utf8');
    } catch(e) {
        console.error(`Failed to patch syntax error in ${file}:`, e.message);
    }
});
