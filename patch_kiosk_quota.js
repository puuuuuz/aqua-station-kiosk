const fs = require('fs');

const file = 'station-v121.html';
if (!fs.existsSync(file)) {
    console.error("File not found");
    process.exit(1);
}
let content = fs.readFileSync(file, 'utf8');

// 1. Remove MAX_DAILY_QUOTA capping
content = content.replace(
    /window\.maxLiters = _hasExtraPhone \? _rawMaxLiters : Math\.min\(_rawMaxLiters, MAX_DAILY_QUOTA\);/g,
    "window.maxLiters = _rawMaxLiters;"
);
content = content.replace(
    /window\.maxLiters = _hasExtraQR \? remainingQuota : Math\.min\(remainingQuota, MAX_DAILY_QUOTA\);/g,
    "window.maxLiters = remainingQuota;"
);
content = content.replace(
    /const _qrCap = _hasExtraFinal \? remainingQuota : Math\.min\(remainingQuota, MAX_DAILY_QUOTA\);/g,
    "const _qrCap = remainingQuota;"
);

// 2. Fix maxQuota calculation fallback (Phone flow)
content = content.replace(
    /let maxQuota = parseFloat\(userData\.quota \?\? 2\.0\);/g,
    "let maxQuota = parseFloat(userData.quota ?? (userData.customQuota ?? 2.0));"
);

// 3. Fix maxQuota calculation fallback (QR flow)
content = content.replace(
    /let maxQuota = parseFloat\(primaryData\.quota \?\? 2\.0\);/g,
    "let maxQuota = parseFloat(primaryData.quota ?? (primaryData.customQuota ?? 2.0));"
);

// 4. Fix originalLitersLeft initialization to fallback to maxQuota instead of 2.0 (Phone flow)
content = content.replace(
    /window\.originalLitersLeft = parseFloat\(userData\.litersLeft \?\? 2\.0\);/g,
    "window.originalLitersLeft = parseFloat(userData.litersLeft ?? maxQuota);"
);

// 5. Fix originalLitersLeft initialization (QR flow)
content = content.replace(
    /window\.originalLitersLeft = parseFloat\(primaryData\.litersLeft \?\? 2\.0\);/g,
    "window.originalLitersLeft = parseFloat(primaryData.litersLeft ?? maxQuota);"
);

// 6. Fix ensureUserQuotaReset to support `quota` variable!
const targetReset = `                if (userData.customQuota !== undefined && userData.customQuota !== null && userData.customQuota !== "") {
                    calculatedMax = parseFloat(userData.customQuota);
                } else {
                    try {
                        const configDoc = await window.getDoc(window.doc(window.db, "settings", "quota_config"));`;

const replaceReset = `                if (userData.quota !== undefined && userData.quota !== null && userData.quota !== "") {
                    calculatedMax = parseFloat(userData.quota);
                } else if (userData.customQuota !== undefined && userData.customQuota !== null && userData.customQuota !== "") {
                    calculatedMax = parseFloat(userData.customQuota);
                } else {
                    try {
                        const configDoc = await window.getDoc(window.doc(window.db, "settings", "quota_config"));`;

content = content.replace(targetReset, replaceReset);

fs.writeFileSync(file, content);
console.log("✅ Patched station-v121.html to fix 2.0L quota bugs");
