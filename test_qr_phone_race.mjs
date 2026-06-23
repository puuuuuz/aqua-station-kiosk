import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTest() {
    const testUid = "TEST_QR_PHONE_USER";
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });

    console.log("======================================================");
    console.log("🕵️‍♂️ เริ่มต้นการทดสอบ: ยิงพร้อมกันเป๊ะๆ ด้วย QR และ เบอร์โทร");
    console.log("======================================================");

    // 1. สร้าง User ให้มีโควตาแค่ 2 ลิตร
    await setDoc(doc(db, "users", testUid), {
        name: "นายสองหน้า สแกนและกดเบอร์",
        litersLeft: 2.0,
        extraQuota: 0,
        lastQuotaResetDate: todayStr
    });

    console.log("▶️ [Case พิเศษ] โควตา 2.0 ลิตร พยายามยิงสร้าง Session 2 อันพร้อมกันเป๊ะๆ...");
    console.log("   (จำลองพฤติกรรม: ตัวเองสแกน QR ตู้แรก แล้วให้เพื่อนกดเบอร์โทรตู้ที่สองในเสี้ยววินาทีเดียวกัน)");

    // 2. ยิงคำสั่งสร้าง Session เข้า Firestore สองอันพร้อมกัน!
    // SESS_QR = สแกน QR (สมมติว่าเป็น T01)
    // SESS_PHONE = กดเบอร์โทร (สมมติว่าเป็น T02)
    const p1 = setDoc(doc(db, "sessions", "SESS_QR"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    const p2 = setDoc(doc(db, "sessions", "SESS_PHONE"), { userUid: testUid, status: "confirmed", kioskId: "T02" });

    await Promise.all([p1, p2]);
    console.log("   ⏳ ส่งคำสั่งเข้า Database พร้อมกันสำเร็จ รอเซิร์ฟเวอร์ประมวลผล...");
    await sleep(8000);

    // 3. ตรวจสอบผลลัพธ์
    const sessQr = await getDoc(doc(db, "sessions", "SESS_QR"));
    const sessPhone = await getDoc(doc(db, "sessions", "SESS_PHONE"));

    console.log(`\n   ผลลัพธ์จากเซิร์ฟเวอร์:`);
    console.log(`   - Session ฝั่ง QR: [${sessQr.data().status}]`);
    console.log(`   - Session ฝั่งกดเบอร์: [${sessPhone.data().status}]`);

    if (
        (sessQr.data().status === "confirmed" && sessPhone.data().status === "quota_exceeded") ||
        (sessQr.data().status === "quota_exceeded" && sessPhone.data().status === "confirmed")
    ) {
        console.log("\n   ✅ ผ่าน! เซิร์ฟเวอร์ป้องกันการเบิ้ลโควตาได้สมบูรณ์ (อีกตู้นึงถูกเตะออก)");
    } else {
        console.log("\n   ❌ ผิดพลาด เซิร์ฟเวอร์ปล่อยให้ทะลุ 2 ตู้ หรือมีสถานะที่ไม่คาดคิด");
    }

    // Cleanup
    await deleteDoc(doc(db, "users", testUid));
    await deleteDoc(doc(db, "sessions", "SESS_QR"));
    await deleteDoc(doc(db, "sessions", "SESS_PHONE"));
    process.exit(0);
}

runTest();
