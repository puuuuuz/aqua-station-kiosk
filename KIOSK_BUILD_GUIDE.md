# 📱 คู่มือ Build APK Kiosk Mode — Aqua Station

## สิ่งที่เพิ่มในโค้ดไปแล้ว

✅ **ปุ่ม Back** → ถูกบล็อก 100%  
✅ **ปุ่ม Home / Recent Apps** → ถูกบล็อก  
✅ **หน้าจอสว่างตลอด** → `FLAG_KEEP_SCREEN_ON`  
✅ **ซ่อน Navigation Bar / Status Bar** → Immersive Fullscreen Mode  
✅ **Lock Task Mode** → ล็อกหน้าต่างแอปไม่ให้ออกได้ (ต้องตั้ง Device Owner ก่อน)  
✅ **Boot as Launcher** → ตั้งค่าให้แอปนี้เป็น "หน้าแรก" แทน Android ได้

---

## ขั้นตอน Build APK

### 1. ติดตั้ง Android Studio
ดาวน์โหลดที่: https://developer.android.com/studio

### 2. เปิด Project
- เปิด Android Studio → "Open" → เลือกโฟลเดอร์ `android/` ในโปรเจกต์นี้
- รอ Gradle Sync เสร็จ (~2 นาที)

### 3. Build APK
เมนูบน → **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

ไฟล์จะอยู่ที่:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## วิธีตั้ง Kiosk Mode เต็มรูปแบบ (ห้ามออกจากแอปได้เลย)

### ตั้งผ่าน ADB (แนะนำสำหรับ Kiosk ถาวร)

> **ต้องทำครั้งเดียวต่ออุปกรณ์เท่านั้น**

```bash
# 1. เปิด USB Debugging บน Tablet
# 2. เสียบ USB เข้า Mac แล้วรันคำสั่งนี้:

adb shell dpm set-device-owner com.scd.smartwater/.KioskDeviceAdminReceiver
```

เมื่อตั้งเป็น Device Owner แล้ว — แอปจะมีสิทธิ์:
- ล็อก Lock Task แบบเต็ม (ออกไม่ได้จนกว่าจะสั่งถอนสิทธิ์)
- ปิด Notification Bar
- ตั้งเป็น Default Home App ถาวร

### ออกจาก Kiosk Mode (สำหรับผู้ดูแลระบบ)

```bash
# ปลดล็อก Device Owner ผ่าน ADB
adb shell dpm remove-active-admin com.scd.smartwater/.KioskDeviceAdminReceiver
```

---

## ทางเลือกสำรอง: Screen Pinning (ไม่ต้อง ADB)

1. ติดตั้ง APK บน Tablet
2. ไปที่ **Settings → Security → Screen Pinning** (หรือ App Pinning) → เปิดใช้งาน
3. เปิดแอป Aqua Station → กดปุ่ม Recent Apps → กด Pin
4. ผู้ใช้จะออกจากแอปไม่ได้ (ต้องกด Back + Recents ค้างพร้อมกัน และใส่ PIN)

