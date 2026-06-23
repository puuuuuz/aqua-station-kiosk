import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit",
    storageBucket: "siam-circuit.firebasestorage.app",
    messagingSenderId: "330527536801",
    appId: "1:330527536801:web:c0132854940609dd3f62e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
    const testUid = "TEST_DOUBLE_SPEND_USER";
    const session1Id = "TEST_SESSION_A";
    const session2Id = "TEST_SESSION_B";
    
    console.log("======================================================");
    console.log("😈 เริ่มต้นการทดสอบ: จำลองพยายามแอบกดพร้อมกัน 2 ตู้");
    console.log("======================================================");

    // 1. สร้าง Test User ที่มีน้ำ 2.0 ลิตร
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
    await setDoc(doc(db, "users", testUid), {
        name: "ผู้ทดสอบ Double Spend",
        litersLeft: 2.0,
        extraQuota: 0,
        lastQuotaResetDate: todayStr
    });
    console.log("1️⃣ เตรียมโควตาตั้งต้น: 2.0 ลิตร\n");

    // 2. จำลองสร้าง 2 Session พร้อมๆ กัน (เหมือนสแกน 2 ตู้พร้อมกัน)
    console.log("2️⃣ กำลังส่งคำสั่งเตรียมจ่ายน้ำ (confirmed) ไปยังเซิร์ฟเวอร์พร้อมกัน 2 Session...");
    
    // ยิงคำสั่งพร้อมกันโดยไม่ใช้ await ขวาง
    const p1 = setDoc(doc(db, "sessions", session1Id), { userUid: testUid, status: "confirmed", kioskId: "KIOSK_A" });
    const p2 = setDoc(doc(db, "sessions", session2Id), { userUid: testUid, status: "confirmed", kioskId: "KIOSK_B" });
    await Promise.all([p1, p2]);

    console.log("   ⏳ รอ 8 วินาที ให้ระบบหลังบ้าน (Cloud Functions) จัดการ...");
    await sleep(8000);

    // 3. ตรวจสอบสถานะว่าใครชนะ และใครถูกบล็อก
    const s1Snap = await getDoc(doc(db, "sessions", session1Id));
    const s2Snap = await getDoc(doc(db, "sessions", session2Id));
    
    console.log("\n3️⃣ ตรวจสอบผลลัพธ์การแข่งกัน:");
    console.log(`   👉 Session A สถานะคือ: [${s1Snap.data().status}]`);
    console.log(`   👉 Session B สถานะคือ: [${s2Snap.data().status}]`);
    
    let blockedSession = s1Snap.data().status === "quota_exceeded" ? session1Id : (s2Snap.data().status === "quota_exceeded" ? session2Id : "ไม่มีเลย");
    console.log(`   🛑 ระบบเซิร์ฟเวอร์ทำการบล็อก Session: ${blockedSession}`);

    if (blockedSession === "ไม่มีเลย") {
        console.log("\n❌ ผลการทดสอบ: ล้มเหลว! ระบบป้องกันทำงานไม่ทัน");
    } else {
        console.log("\n✅ ผลการทดสอบ: ผ่าน! ระบบป้องกันการกดซ้อนทำงานได้สมบูรณ์");
    }

    // 4. ทำความสะอาด
    console.log("\n🧹 ทำความสะอาดข้อมูลทดสอบ...");
    await deleteDoc(doc(db, "users", testUid));
    await deleteDoc(doc(db, "sessions", session1Id));
    await deleteDoc(doc(db, "sessions", session2Id));
    console.log("👋 เสร็จสิ้นการทดสอบ");
    process.exit(0);
}

runTest();
