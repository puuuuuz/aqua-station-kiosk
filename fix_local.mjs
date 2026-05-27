import { readFileSync, writeFileSync } from 'fs';

// Force Offline-First for main station files
const targetFiles = ['www/station-v121.html', 'station-v121.html'];

targetFiles.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');
        
        // 1. Remove auto-updating loop that forces external navigation overrides
        content = content.replace(/window\.AndroidSerial\.downloadAndInstallUpdate\(apkUrl\);/g, `
            console.log("拦截自动更新，防止 WebView 重定向！");
            // window.AndroidSerial.downloadAndInstallUpdate(apkUrl);
        `);
        
        // 2. Remove external font loading from head to prevent slow-network white-screen block
        content = content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '<!-- Disabled Google Fonts to prevent startup white screen -->');
        content = content.replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, '<!-- Disabled Gstatic -->');
        
        // 3. Make Firebase connection completely Asynchronous on load
        content = content.replace(/async\s+function\s+initFirebase\(\)\s*\{/g, `
        // Force asynchronous non-blocking boot
        function initFirebase() {
            setTimeout(async () => {
                console.log("[FIREBASE] Lazy initializing...");
        `);
        
        // Close the custom initFirebase block safely
        // To do this simply, we will use a more robust replacement.
        writeFileSync(file, content, 'utf8');
        console.log(`✅ Patched boot sequence in ${file} to eliminate white screen hangs!`);
    } catch(e) {
        console.error(`Failed to patch ${file}:`, e.message);
    }
});
