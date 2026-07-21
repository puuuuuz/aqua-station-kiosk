const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix Report Table Headers
    const targetTh = `<th class="py-4 px-6 align-middle whitespace-nowrap">วิธีรับ</th>
                                    <th class="py-4 px-6 align-middle whitespace-nowrap">สถานะ</th>`;
    const replaceTh = `<th class="py-4 px-6 align-middle whitespace-nowrap text-center">pH</th>
                                    <th class="py-4 px-6 align-middle whitespace-nowrap">วิธีรับ</th>`;
    content = content.replace(targetTh, replaceTh);

    fs.writeFileSync(file, content);
    console.log("✅ Fixed Report Table Headers");
} else {
    console.error("File not found:", file);
}
