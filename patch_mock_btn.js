const fs = require('fs');
let content = fs.readFileSync('super_admin.html', 'utf8');

// Insert Mock Data button next to Area creation button
content = content.replace('<button onclick="openAddAreaModal()" class="mb-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างพื้นที่ใหม่</button>',
    '<div class="flex gap-3 mb-4"><button onclick="openAddAreaModal()" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างพื้นที่ใหม่</button><button onclick="seedMockData()" class="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all">✨ เพิ่มข้อมูลจำลอง (Mock Data)</button></div>'
);

// Insert Mock Data button next to Admin creation button
content = content.replace('<button onclick="openAddAdminModal()" class="mb-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างบัญชีแอดมิน</button>',
    '<div class="flex gap-3 mb-4"><button onclick="openAddAdminModal()" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">+ สร้างบัญชีแอดมิน</button><button onclick="seedMockData()" class="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all">✨ เพิ่มข้อมูลจำลอง (Mock Data)</button></div>'
);

fs.writeFileSync('super_admin.html', content);
