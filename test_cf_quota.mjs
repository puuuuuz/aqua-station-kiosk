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
    const testUid = "TEST_USER_999";
    const testSessionId = "TEST_SESSION_999";
    
    console.log("==========================================");
    console.log("🧪 เริ่มต้นการทดสอบ Cloud Functions");
    console.log("==========================================");

    // 1. สร้าง Test User ที่มีน้ำ 2.0 ลิตร
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
    await setDoc(doc(db, "users", testUid), {
        name: "ผู้ทดสอบระบบ",
        litersLeft: 2.0,
        extraQuota: 0,
        lastQuotaResetDate: todayStr
    });
    console.log("1️⃣ สร้าง User จำลอง (โควตา 2.0 ลิตร) เรียบร้อย");

    // 2. จำลองสร้าง Session ใหม่ที่หน้าตู้ (เหมือนเพิ่งสแกน QR ผ่าน)
    console.log("\n2️⃣ จำลองตู้ส่งสถานะ 'confirmed' (กำลังเตรียมจ่ายน้ำ)");
    await setDoc(doc(db, "sessions", testSessionId), {
        userUid: testUid,
        status: "confirmed",
        kioskId: "TEST_KIOSK"
    });

    // 3. รอให้ CF (preDeductQuotaOnSessionStart) ทำงาน
    console.log("   ⏳ รอ 10 วินาที ให้ Cloud Functions ทำงานและล็อคโควตา...");
    await sleep(10000);

    let userSnap = await getDoc(doc(db, "users", testUid));
    let ud = userSnap.data();
    console.log(`   👉 ตรวจสอบ User: ตอนนี้โควตาเหลือ = ${ud.litersLeft} ลิตร (ต้องเป็น 0 เพราะถูกล็อค)`);
    console.log(`   👉 สถานะการกดน้ำ (isDispensing) = ${ud.isDispensing ? 'ใช้งานอยู่' : 'ว่าง'}`);

    // 4. จำลองจ่ายน้ำเสร็จสิ้น (เหมือน user ยกแก้วออก)
    console.log("\n3️⃣ จำลองตู้จ่ายน้ำเสร็จสิ้นที่ 0.5 ลิตร (ส่ง status 'finished')");
    // แกล้งทำเป็นบั๊กที่ตู้ คือตู้ "ไม่ได้หักโควตาที่ User เลย" แค่อัปเดต Session อย่างเดียว
    await updateDoc(doc(db, "sessions", testSessionId), {
        status: "finished",
        finalVol: 0.5
    });

    // 5. รอให้ CF (enforceQuotaOnSessionFinish) ทำงานหักโควตา
    console.log("   ⏳ รอ 8 วินาที ให้ Cloud Functions คืนโควตาที่เหลือ...");
    await sleep(8000);

    userSnap = await getDoc(doc(db, "users", testUid));
    ud = userSnap.data();
    console.log(`   👉 ตรวจสอบ User ครั้งสุดท้าย:`);
    console.log(`   👉 โควตาคงเหลือ = ${ud.litersLeft} ลิตร (คาดหวังคือ 1.5 ลิตร)`);
    console.log(`   👉 สถานะการล็อคหลุดไปแล้ว? = ${ud.isDispensing === undefined ? 'ใช่' : 'ไม่ใช่'}`);

    if (ud.litersLeft === 1.5) {
        console.log("\n✅ ผลการทดสอบ: ผ่าน! (Cloud Functions ทำงานถูกต้อง)");
    } else {
        console.log("\n❌ ผลการทดสอบ: ไม่ผ่าน! (โควตาผิดพลาด)");
    }

    // 6. Cleanup ทำความสะอาดข้อมูลทดสอบ
    console.log("\n🧹 กำลังทำความสะอาดข้อมูลทดสอบ...");
    await deleteDoc(doc(db, "users", testUid));
    await deleteDoc(doc(db, "sessions", testSessionId));
    console.log("👋 เสร็จสิ้นการทดสอบ");
    process.exit(0);
}

runTest();
