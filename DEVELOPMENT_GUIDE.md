# 📖 Aqua Station Kiosk - Development Guide
*เอกสารนี้จัดทำขึ้นเพื่อให้ AI และทีมพัฒนาใช้เป็น "ความจำส่วนกลาง" เพื่อป้องกันการแก้ไขไฟล์ผิดพลาดและหลงลืม Context*

## 🏗️ โครงสร้างของโปรเจกต์ (Project Architecture)
โปรเจกต์นี้เป็นแอปพลิเคชัน Android แบบ **Kiosk Mode** (ล็อกหน้าจอ) โดยสร้างจากเทคโนโลยี **Capacitor** ซึ่งใช้ HTML/JS เป็นหน้าตา (UI) และใช้ Java เป็นตัวสื่อสารกับฮาร์ดแวร์

### 1. ไฟล์หลักที่เป็น Source of Truth (ห้ามแก้ไฟล์อื่นถ้าไม่จำเป็น)
- **UI & Frontend (HTML/JS):** `www/index.html`
  - ⚠️ **คำเตือน:** ไฟล์ HTML อื่นๆ เช่น `station-v121.html`, `station-v122.html` หรือ `www/station-v121.html` ถือเป็นไฟล์เก่าหรือไฟล์แบ็คอัป **ไฟล์ที่แอป Capacitor ดึงไปใช้งานจริงและรันบนเครื่องคือ `www/index.html` เท่านั้น** การแก้ UI ต้องทำที่นี่
- **Hardware & App Wrapper (Java):** `android/app/src/main/java/com/scd/kiosk/aqua/MainActivity.java`
  - ดูแลเรื่อง Kiosk Mode, Watchdog (Auto-restart), การอ่านค่าผ่าน Serial Port (RS485/UART), และการขอ Permission ต่างๆ
- **Android Configuration:** `android/app/src/main/AndroidManifest.xml`
- **Capacitor Configuration:** `capacitor.config.json`

### 2. เทคโนโลยีที่ใช้
- **Database:** Firebase / Firestore (สำหรับเก็บ Transaction, Quota ของ User และ Machine Status)
- **Device Communication:** สื่อสารกับบอร์ดผ่านทาง JavaScript interface `window.AndroidSerial` ซึ่งถูก Bridge มาจาก `MainActivity.java`

## 🛠️ กฎเหล็กในการพัฒนา (Development Rules)
1. **แก้ UI ต้องอัปเดต `www/index.html`:** หากมีการทดสอบโค้ดในไฟล์อื่น (เช่น `station-v121.html`) เมื่อทดสอบเสร็จจะต้องนำโค้ดที่สมบูรณ์มาใส่ใน `www/index.html` ทุกครั้งก่อนสั่ง Build
2. **การ Build APK:** โครงการนี้ผูกกับ **GitHub Actions** หากแก้โค้ดเสร็จแล้ว ให้ทำการ `git add`, `git commit` และ `git push` ไปยัง Branch `main` เพื่อให้ GitHub Actions จัดการ Build APK อัตโนมัติ (AI ไม่ต้องบิลด์เองผ่าน Terminal)
3. **ห้ามยุ่งกับหน้าจอผ่าน `display` ตรงๆ:** การสลับหน้าจอ (UI State) ใน `www/index.html` จะต้องถูกจัดการผ่านฟังก์ชัน `async function showScreen(name)` เท่านั้น เพื่อให้ระบบจัดการการเคลียร์ค่าขยะ ปิด/เปิดเสียง และนับเวลา Idle Timeout ได้อย่างถูกต้อง
4. **ระวัง Watchdog & AlarmManager:** ระบบ Android 12+ มีความเข้มงวดเรื่อง `SCHEDULE_EXACT_ALARM` หากยุ่งกับระบบ Watchdog (ตั้งเวลารีสตาร์ทแอป) ต้องเช็ค Permission เสมอเพื่อป้องกันแอปแครช

## 🔄 กระบวนการทำงานกับ AI
เมื่อเริ่มแชทใหม่กับ AI ให้ผู้ใช้งาน Copy ข้อความนี้ส่งให้ AI เสมอ:
> *"ก่อนเริ่มงาน ให้ไปอ่านไฟล์ `DEVELOPMENT_GUIDE.md` เพื่อทำความเข้าใจโครงสร้างและกฎของโปรเจกต์นี้ก่อน"*

---
*อัปเดตล่าสุด: มิถุนายน 2026 (แก้ไขบั๊ก UI เด้งกลับ และ Android 12 AlarmManager Crash)*
