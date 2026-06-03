# คู่มือป้องกันการเกิดปัญหาหน้าจอขาวค้าง (Low Water Overlay & WSOD Prevention)

เอกสารฉบับนี้ถูกเขียนขึ้นเพื่อสรุปและบันทึกแนวทางแก้ไขปัญหา **"หน้าจอขาวค้าง/ปุ่มกดถูกบล็อก"** จากระบบหน้ากากเตือนน้ำหมด (Low Water Overlay) เพื่อไม่ให้กลับมาเกิดปัญหานี้ซ้ำอีกในเวอร์ชันต่อๆ ไป

---

## 1. ปัญหาและอาการที่เกิดขึ้น (The Problem)

เมื่อระบบตรวจพบแพ็กเก็ตแจ้งเตือน `FAIL` จากบอร์ดควบคุมตัวหลัก (`0xC1`) เช่น สัญญาณเพรสเชอร์สวิตช์ทำงาน หรือ น้ำในถังต่ำกว่ากำหนด:
1. **การหลุดเข้าหน้าทำรายการ (Bypass):** ผู้ใช้งานยังสามารถกดคลิกผ่านหน้า Standby (หน้าแรกสุด) เข้ามาจนถึงหน้าสแกน QR Code หรือหน้าป้อนเบอร์โทรศัพท์ได้ เนื่องจากสัญญาณการส่งโพลล์ผ่านพอร์ตซีเรียลทำงานล่าช้ากว่าความเร็วในการกดปุ่มของผู้ใช้ในตอนแรก (Boot/Initialization Latency)
2. **หน้าจอขาวค้าง (White Screen of Death / Freeze):** เมื่อสัญญาณ `isLowWater` เป็น `true` ตามมาทีหลัง ตัวหน้ากากแจ้งเตือน (`#kioskSystemOverlay`) จะทำงานทับหน้าจอปัจจุบัน ส่งผลให้:
   - แสงสีขาวสว่างจากพื้นหลังปกติ (`#f8fafc`) รวมเข้ากับ CSS `backdrop-filter: blur(5px)` ของหน้ากาก ทำให้มองเห็นเป็นหน้าจอสีขาวโพลน/เบลอ คล้ายแอปพลิเคชันค้าง
   - คำสั่ง `event.stopPropagation()` และ `pointer-events: auto` บนหน้ากากบล็อกไม่ให้ผู้ใช้สามารถกดสัมผัสหน้าจอส่วนใดๆ ได้อีกต่อไป

---

## 2. วิธีการแก้ไขที่ทำงานไปแล้ว (Implemented Solutions)

ในไฟล์ [station-v121.html](file:///Users/onelinkdeverlopment/.gemini/antigravity/playground/shimmering-orion-local/station-v121.html) ได้ทำการปรับปรุงโค้ด 3 จุดเพื่อปิดช่องโหว่นี้ถาวร:

### จุดที่ 1: ปรับสไตล์ Overlay ให้เป็น "หน้าจอมืดแจ้งเตือน" (Solid Dark UI)
ยกเลิกการใช้ฉากหลังเบลอและเปลี่ยนเป็นพื้นหลังสีเข้มทึบเพื่อให้ผู้ใช้อ่านข้อความเตือนได้ทันที ไม่สับสนว่าแอปค้าง:
```css
#kioskSystemOverlay {
    background: rgba(15, 23, 42, 0.98); /* เปลี่ยนเป็นสีกรมท่าเข้มเกือบเสมือนทึบ */
    backdrop-filter: none;              /* เอาเอฟเฟกต์เบลอออกเพื่อแก้ปัญหาหน้าขาวค้าง */
    border: 4px solid #ef4444;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}
#kioskSystemOverlay::before {
    background: rgba(0, 0, 0, 0.85);    /* ปรับมืดฉากหลังเบื้องหลังให้ทึบขึ้น */
}
```

### จุดที่ 2: บล็อกปุ่มกดหน้าแรก (Standby Screen Block)
เพิ่มการเช็คตัวแปร `window.isLowWater` ในหน้า Standby หากมีค่าเป็น `true` จะถูกสั่งบล็อกทันที:
```javascript
function handleStandbyClick(e) {
    const overlay = document.getElementById('kioskSystemOverlay');
    if (overlay && overlay.classList.contains('active')) return;
    
    // 🛡️ บล็อกทันทีถ้าน้ำหมด
    if (window.isLowWater === true) {
        console.warn("[UI] Blocked standby click because water is empty");
        if (overlay) {
            overlay.classList.add('active');
            overlay.style.display = 'flex';
        }
        return;
    }
    // ... ทำงานปกติ
}
```

### จุดที่ 3: บล็อกระบบเปลี่ยนหน้าจอ (Navigation Guard)
เพิ่มการตรวจสอบระดับระบบในฟังก์ชัน `showScreen(name)` เพื่อป้องกันการสั่งเปลี่ยนหน้าจากฟังก์ชันสตรีมอื่นๆ:
```javascript
async function showScreen(name) {
    console.log('🎬 [UI] showScreen:', name);
    
    // 🛡️ หากน้ำหมดและไม่ใช่การกลับไปหน้า standby ให้ยกเลิกการเปลี่ยนหน้าทั้งหมด
    if (window.isLowWater === true && name !== 'standby') {
        console.warn("🚫 [UI] showScreen blocked transition to " + name + " because water is empty.");
        const overlay = document.getElementById('kioskSystemOverlay');
        if (overlay) {
            overlay.classList.add('active');
            overlay.style.display = 'flex';
        }
        return;
    }
    // ...
}
```

---

## 3. กฎเหล็กในการพัฒนาระบบเพื่อป้องกันปัญหาในอนาคต (Best Practices)

1. **ห้ามใช้โปร่งใสเบลอครอบคลุมทั้งหน้าจอ (`backdrop-filter: blur`):**
   การเบลอหน้าจอทั้งหมดเหมาะสำหรับ Pop-up เล็กๆ แต่ไม่เหมาะกับหน้าจอแจ้งเตือนระบบขัดข้องระดับวิกฤต (Critical System Failures) เพราะจะทำให้ระบุปัญหาบนตู้กดจริงได้ยากและดูเหมือนเครื่องค้าง ให้ใช้ดีไซน์กล่องมืดหรือกล่องแจ้งเตือนทึบสีชัดเจนเสมอ
2. **ต้องบล็อกที่ระดับ Logic ไม่ใช่แค่ UI:**
   อย่าวางใจให้กล่อง Overlay บล็อกการสัมผัสเพียงอย่างเดียว เนื่องจากอาจมีกรณีที่ข้อมูลซีเรียลมาล่าช้ากว่าปุ่มกด ให้เพิ่ม Logic บล็อกเปลี่ยนหน้าในฟังก์ชันหลัก เช่น `showScreen` เสมอ
3. **กำหนดคุณสมบัติให้ `isLowWater` รีเซ็ตตามดีบอนซ์:**
   สถานะระดับน้ำต่ำจะต้องอ้างอิงจากรอบการดึงข้อมูลและมีการหน่วงเวลาเช็คคืนค่า (Debounce Check) 5 วินาทีก่อนจะเคลียร์ค่าเป็น `false` เพื่อป้องกันบอร์ดสแกนไม่ทันหรือกระพริบระหว่างจ่ายน้ำ
