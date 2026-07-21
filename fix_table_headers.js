const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const oldHeaders = `<tr>
                                <th class="py-4 px-6">อีเมล (Email)</th>
                                <th class="py-4 px-6">พื้นที่สังกัด (Area)</th>
                                <th class="py-4 px-6">สิทธิ์การใช้งาน (Role)</th>
                                <th class="py-4 px-8 w-24">จัดการ</th>
                            </tr>`;
                            
    const newHeaders = `<tr>
                                <th class="py-4 px-6">ID</th>
                                <th class="py-4 px-6">อีเมล (Email)</th>
                                <th class="py-4 px-6">พื้นที่สังกัด (Area)</th>
                                <th class="py-4 px-6">สถานะ (Status)</th>
                                <th class="py-4 px-8 w-24 text-right">จัดการ</th>
                            </tr>`;

    // Also fix the colspan in the empty state
    const oldEmptyState = `<td colspan="4" class="py-10 text-center font-black text-slate-300 dark:text-slate-600 italic text-xs uppercase tracking-widest">ยังไม่มีข้อมูลแอดมินสาขา...</td>`;
    const newEmptyState = `<td colspan="5" class="py-10 text-center font-black text-slate-300 dark:text-slate-600 italic text-xs uppercase tracking-widest">ยังไม่มีข้อมูลแอดมินสาขา...</td>`;

    if (content.includes(oldHeaders)) {
        content = content.replace(oldHeaders, newHeaders);
        content = content.replace(oldEmptyState, newEmptyState);
        fs.writeFileSync(file, content);
        console.log('Fixed local admins table headers');
    } else {
        console.log('Headers not found, maybe formatting mismatch.');
    }
}
