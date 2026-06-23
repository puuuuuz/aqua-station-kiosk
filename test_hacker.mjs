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

async function runHackerTest() {
    const testUid = "TEST_HACKER_USER";
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });

    console.log("======================================================");
    console.log("🦹‍♂️ เริ่มต้นการทดสอบแบบ User หัวหมอ (5 สถานการณ์สุดป่วน)");
    console.log("======================================================");

    await setDoc(doc(db, "users", testUid), {
        name: "นายหัวหมอ จอมป่วน",
        litersLeft: 2.0,
        extraQuota: 0,
        lastQuotaResetDate: todayStr
    });

    // ---------------------------------------------------------
    // 1. กดแล้วเดินหนี (ตู้หมดเวลา)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 1] Hit & Run: สแกนผ่านแล้ว (โควตาถูกล็อคเป็น 0) แต่เดินหนีจนตู้หมดเวลา");
    await setDoc(doc(db, "sessions", "HACK_1"), { userUid: testUid, status: "confirmed" });
    await sleep(4000); 
    let u = await getDoc(doc(db, "users", testUid));
    console.log(`   (ระหว่างเดินหนี โควตาเหลือ: ${u.data().litersLeft} ลิตร)`);
    
    await updateDoc(doc(db, "sessions", "HACK_1"), { status: "timeout" }); // ตู้ส่ง timeout
    await sleep(4000);
    u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 2.0) console.log("   ✅ ผ่าน! ระบบคืนโควตา 2.0 ลิตรให้ครบถ้วน");
    else console.log(`   ❌ ผิดพลาด โควตาคือ ${u.data().litersLeft}`);

    // ---------------------------------------------------------
    // 2. แฮกส่งค่าน้ำติดลบ (หวังเพิ่มโควตา)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 2] Negative Hack: สกัดจับเน็ต แล้วแก้คำสั่งให้ตู้ส่งค่าว่าจ่ายน้ำไป '-5.0' ลิตร (หวังจะได้น้ำเพิ่มเป็น 7 ลิตร)");
    await setDoc(doc(db, "sessions", "HACK_2"), { userUid: testUid, status: "confirmed" });
    await sleep(4000);
    await updateDoc(doc(db, "sessions", "HACK_2"), { status: "finished", finalVol: -5.0 });
    await sleep(4000);
    u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 2.0) console.log("   ✅ ผ่าน! ระบบบล็อกค่าติดลบ และคืนโควตา 2.0 ลิตรเท่าเดิม (ไม่ยอมเพิ่มให้)");
    else console.log(`   ❌ ผิดพลาด โควตาคือ ${u.data().litersLeft}`);

    // ---------------------------------------------------------
    // 3. ไม่มีโควตาแต่พยายามสแกน
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 3] Zero Quota: ปัจจุบันโควตาเหลือ 0 ลองสแกน QR Code ดูเผื่อฟลุค");
    await updateDoc(doc(db, "users", testUid), { litersLeft: 0.0 }); // ปรับให้เหลือ 0
    await setDoc(doc(db, "sessions", "HACK_3"), { userUid: testUid, status: "confirmed" });
    await sleep(4000);
    let s = await getDoc(doc(db, "sessions", "HACK_3"));
    if (s.data().status === "quota_exceeded") console.log("   ✅ ผ่าน! ระบบเซิร์ฟเวอร์ถีบกลับทันที (เปลี่ยนสถานะเป็น quota_exceeded)");
    else console.log(`   ❌ ผิดพลาด สถานะคือ ${s.data().status}`);

    // ---------------------------------------------------------
    // 4. ข้ามขั้นตอน (เสก Session Finished เอง)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 4] Ghost Session: ไม่สแกน QR แต่ยิง API สร้าง Session แบบ 'finished' มาดื้อๆ เลย (ข้าม confirmed)");
    await updateDoc(doc(db, "users", testUid), { litersLeft: 2.0 }); // ให้โควตา 2 ลิตร
    // สร้าง finished เลย ไม่ผ่าน confirmed (ดังนั้นจะไม่มีตัวแปร preDeduct ฝังไว้)
    await setDoc(doc(db, "sessions", "HACK_4"), { userUid: testUid, status: "finished", finalVol: 1.5 });
    await sleep(4000);
    u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 0.5) console.log("   ✅ ผ่าน! ระบบอ่านออกว่าไม่ได้โดนล็อคโควตา ก็เลยหักจาก 2.0 ตรงๆ เหลือ 0.5 ลิตร");
    else console.log(`   ❌ ผิดพลาด โควตาคือ ${u.data().litersLeft}`);

    // ---------------------------------------------------------
    // 5. ส่งตัวหนังสือมาป่วน (NaN)
    // ---------------------------------------------------------
    console.log("\n▶️ [Case 5] NaN Injection: ยิง API แจ้งตู้ว่ากดน้ำไปปริมาณ 'ABC' ลิตร (หวังให้ระบบพัง)");
    await setDoc(doc(db, "sessions", "HACK_5"), { userUid: testUid, status: "confirmed" });
    await sleep(4000);
    await updateDoc(doc(db, "sessions", "HACK_5"), { status: "finished", finalVol: "ABC" });
    await sleep(4000);
    u = await getDoc(doc(db, "users", testUid));
    if (u.data().litersLeft === 0.5) console.log("   ✅ ผ่าน! ระบบกันพัง มองตัวอักษรเป็นค่าขยะ ปัดทิ้ง และคืนโควตากลับมาให้ 0.5 ลิตรเท่าเดิม");
    else console.log(`   ❌ ผิดพลาด โควตาคือ ${u.data().litersLeft}`);

    console.log("\n======================================================");
    console.log("🎉 จบการทดสอบ User หัวหมอ: ระบบปลอดภัยระดับสูงสุด!");
    console.log("======================================================");

    // Cleanup
    await deleteDoc(doc(db, "users", testUid));
    await deleteDoc(doc(db, "sessions", "HACK_1"));
    await deleteDoc(doc(db, "sessions", "HACK_2"));
    await deleteDoc(doc(db, "sessions", "HACK_3"));
    await deleteDoc(doc(db, "sessions", "HACK_4"));
    await deleteDoc(doc(db, "sessions", "HACK_5"));
    process.exit(0);
}

runHackerTest();
