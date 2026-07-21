const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const oldTileOptions = `            baseMapLayer = L.tileLayer(tileUrl, {
                attribution: '© OpenStreetMap',
                updateWhenZooming: false,
                updateWhenIdle: true,
                keepBuffer: 4
            }).addTo(map);`;
            
    const newTileOptions = `            baseMapLayer = L.tileLayer(tileUrl, {
                attribution: '© OpenStreetMap',
                updateWhenZooming: true,     // โหลด tile ระหว่างที่กำลังซูม (ไม่รอซูมเสร็จ)
                updateWhenIdle: false,       // โหลด tile ทันทีที่เลื่อนแผนที่ (ไม่รอปล่อยเมาส์)
                keepBuffer: 8,               // โหลดล่วงหน้ารอบๆ หน้าจอเยอะขึ้น (เพื่อไม่ให้ขอบแหว่ง)
                crossOrigin: true,           // ช่วยเรื่อง Cache ของ Browser ให้ทำงานดีขึ้น
                maxNativeZoom: 19            // ช่วยให้ซูมลึกๆ แล้วภาพไม่แตก
            }).addTo(map);`;

    if (content.includes(oldTileOptions)) {
        content = content.replace(oldTileOptions, newTileOptions);
        fs.writeFileSync(file, content);
        console.log('Successfully optimized leaflet map rendering.');
    } else {
        console.log('Target block not found. Maybe it was already updated?');
    }
}
