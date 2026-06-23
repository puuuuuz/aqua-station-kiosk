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

async function runNormalTest() {
    const testUid = "TEST_NORMAL_USER";
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });

    console.log("======================================================");
    console.log("🧑‍🦱 เริ่มต้นการทดสอบ: พฤติกรรม User ทั่วไปแบบหัวหมอ (5 สถานการณ์)");
    console.log("======================================================");

    // สร้าง User เริ่มต้นโควตา 2.0 ลิตร
    await setDoc(doc(db, "users", testUid), {
        name: "นายหัวหมอ แบบบ้านๆ",
        litersLeft: 2.0,
        extraQuota: 0,
        lastQuotaResetDate: todayStr
    });

    // ---------------------------------------------------------
    // 1. กดน้ำพร้อมกัน 2 ตู้ (Double Spend)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 1] สแกน QR ตู้แรก แล้วให้เพื่อนรีบกดเบอร์โทรอีกตู้นึงพร้อมๆ กัน");
    // รีเซ็ตให้มี 2 ลิตร
    await updateDoc(doc(db, "users", testUid), { litersLeft: 2.0 });
    const p1 = setDoc(doc(db, "sessions", "NORM_1A"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    const p2 = setDoc(doc(db, "sessions", "NORM_1B"), { userUid: testUid, status: "confirmed", kioskId: "T02" });
    await Promise.all([p1, p2]);
    await sleep(8000);
    
    let s1 = await getDoc(doc(db, "sessions", "NORM_1A"));
    let s2 = await getDoc(doc(db, "sessions", "NORM_1B"));
    let blockedCount = (s1.data().status === "quota_exceeded" ? 1 : 0) + (s2.data().status === "quota_exceeded" ? 1 : 0);
    if (blockedCount === 1) console.log("   ✅ ผ่าน! ระบบอนุญาตแค่ตู้เดียว อีกตู้ถูกถีบออกทันที (บล็อกการกดซ้อน)");
    else console.log("   ❌ ผิดพลาด");
    
    // เคลียร์ session จบการทำงานตู้ที่รอด
    let activeSession = s1.data().status === "confirmed" ? "NORM_1A" : "NORM_1B";
    await updateDoc(doc(db, "sessions", activeSession), { status: "finished", finalVol: 0 }); // คืนน้ำไปก่อน
    await sleep(8000);

    // ---------------------------------------------------------
    // 2. สแกนแล้วเปลี่ยนใจเดินหนี (Timeout)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 2] สแกน QR ผ่านแล้ว (ตู้บอกให้กดน้ำ) แต่เปลี่ยนใจเดินหนี ปล่อยตู้ทิ้งไว้จนหมดเวลา");
    await updateDoc(doc(db, "users", testUid), { litersLeft: 2.0 }); // Reset quota
    await setDoc(doc(db, "sessions", "NORM_2"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    await sleep(8000); // โควตาโดนล็อคเป็น 0

    let debugU = await getDoc(doc(db, "users", testUid));
    console.log("   [DEBUG] ก่อนส่ง timeout, User data: ", debugU.data());

    await updateDoc(doc(db, "sessions", "NORM_2"), { status: "timeout" }); // ตู้หมดเวลาส่ง timeout
    await sleep(8000);
    
    let u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 2.0) console.log("   ✅ ผ่าน! ระบบคืนโควตา 2.0 ลิตรกลับมาให้ครบ ไม่โดนยึดฟรี");
    else console.log(`   ❌ ผิดพลาด โควตาเหลือ: ${u.data().litersLeft}`);

    // ---------------------------------------------------------
    // 3. กดน้ำแล้วกดหยุดกลางคัน (Cancelled)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 3] โควตา 2 ลิตร กดน้ำไปได้แค่ 0.5 ลิตร แล้วกดปุ่ม STOP (สถานะ Cancelled)");
    await updateDoc(doc(db, "users", testUid), { litersLeft: 2.0 }); // Reset quota
    await setDoc(doc(db, "sessions", "NORM_3"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    await sleep(8000);
    await updateDoc(doc(db, "sessions", "NORM_3"), { status: "cancelled", finalVol: 0.5 }); // ยกเลิกกลางคัน
    await sleep(8000);
    
    u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 1.5) console.log("   ✅ ผ่าน! ระบบหักน้ำไป 0.5 ลิตร และทอนกลับมาให้ 1.5 ลิตรถูกต้อง");
    else console.log(`   ❌ ผิดพลาด โควตาเหลือ: ${u.data().litersLeft}`);

    // ---------------------------------------------------------
    // 4. เอาขวดใหญ่มากด (เกินโควตา)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 4] โควตาเหลือ 1.5 ลิตร เอาขวด 2 ลิตรมากดเปิดน้ำทิ้งไว้จนเครื่องตัดไปเอง");
    await updateDoc(doc(db, "users", testUid), { litersLeft: 1.5 }); // Reset quota
    await setDoc(doc(db, "sessions", "NORM_4"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    await sleep(8000);
    // ตู้จะตัดที่ 1.5 แต่สมมติบั๊กตู้ส่ง 1.6 มา
    await updateDoc(doc(db, "sessions", "NORM_4"), { status: "finished", finalVol: 1.6 }); 
    await sleep(8000);
    
    u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 0) console.log("   ✅ ผ่าน! ระบบหักจนหมดเกลี้ยง (เหลือ 0 ลิตร) และไม่ยอมให้ติดลบ");
    else console.log(`   ❌ ผิดพลาด โควตาเหลือ: ${u.data().litersLeft}`);

    // ---------------------------------------------------------
    // 5. สแกนเบิ้ลที่ตู้เดิม (เน็ตช้า)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 5] โควตาหมดแล้ว (0 ลิตร) แต่เน็ตช้า เลยโมโหสแกน QR รัวๆ 2 รอบติดๆ กัน");
    const p3 = setDoc(doc(db, "sessions", "NORM_5A"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    const p4 = setDoc(doc(db, "sessions", "NORM_5B"), { userUid: testUid, status: "confirmed", kioskId: "T01" });
    await Promise.all([p3, p4]);
    await sleep(8000);

    let s3 = await getDoc(doc(db, "sessions", "NORM_5A"));
    let s4 = await getDoc(doc(db, "sessions", "NORM_5B"));
    if (s3.data().status === "quota_exceeded" && s4.data().status === "quota_exceeded") {
        console.log("   ✅ ผ่าน! ระบบเด้งออกทั้ง 2 รอบทันที (แจ้งว่าโควตาหมด)");
    } else {
        console.log("   ❌ ผิดพลาด สถานะไม่ถูกต้อง");
    }

    console.log("\n======================================================");
    console.log("🎉 จบการทดสอบพฤติกรรม User แบบบ้านๆ: ระบบรับมือได้สบาย!");
    console.log("======================================================");

    // Cleanup
    await deleteDoc(doc(db, "users", testUid));
    await deleteDoc(doc(db, "sessions", "NORM_1A"));
    await deleteDoc(doc(db, "sessions", "NORM_1B"));
    await deleteDoc(doc(db, "sessions", "NORM_2"));
    await deleteDoc(doc(db, "sessions", "NORM_3"));
    await deleteDoc(doc(db, "sessions", "NORM_4"));
    await deleteDoc(doc(db, "sessions", "NORM_5A"));
    await deleteDoc(doc(db, "sessions", "NORM_5B"));
    process.exit(0);
}

runNormalTest();
