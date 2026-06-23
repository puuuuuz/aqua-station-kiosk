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
    const testUid = "TEST_COMPREHENSIVE_USER";
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });

    console.log("======================================================");
    console.log("🧪 การทดสอบแบบละเอียด (Comprehensive Test 3 สถานการณ์)");
    console.log("======================================================");

    // สร้าง User
    await setDoc(doc(db, "users", testUid), {
        name: "ผู้ทดสอบแบบละเอียด",
        litersLeft: 2.0,
        extraQuota: 0,
        lastQuotaResetDate: todayStr
    });

    let passCount = 0;

    // ---------------------------------------------------------
    // Scenario 1: กดปกติแบบเหลือเศษ
    // ---------------------------------------------------------
    console.log("\n▶️ [Scenario 1] โควตา 2.0 ลิตร กดไป 1.2 ลิตร");
    await setDoc(doc(db, "sessions", "SESSION_1"), { userUid: testUid, status: "confirmed" });
    await sleep(4000); // รอ Lock
    await updateDoc(doc(db, "sessions", "SESSION_1"), { status: "finished", finalVol: 1.2 });
    await sleep(4000); // รอคืนโควตา
    
    let uSnap = await getDoc(doc(db, "users", testUid));
    if (uSnap.data().litersLeft === 0.8) {
        console.log("   ✅ ผ่าน! โควตาเหลือ 0.8 ลิตรถูกต้อง");
        passCount++;
    } else {
        console.log(`   ❌ ผิดพลาด! โควตาเหลือ ${uSnap.data().litersLeft} ลิตร (คาดหวัง: 0.8)`);
    }

    // ---------------------------------------------------------
    // Scenario 2: โควตาเหลือ 0.8 ลิตร แต่แอบกดไป 1.0 ลิตร (เกิน)
    // ---------------------------------------------------------
    console.log("\n▶️ [Scenario 2] โควตาเหลือ 0.8 ลิตร แต่ตู้ส่งมาว่าจ่ายไป 1.0 ลิตร (แอบโกงตู้)");
    await setDoc(doc(db, "sessions", "SESSION_2"), { userUid: testUid, status: "confirmed" });
    await sleep(4000);
    await updateDoc(doc(db, "sessions", "SESSION_2"), { status: "finished", finalVol: 1.0 });
    await sleep(4000);

    uSnap = await getDoc(doc(db, "users", testUid));
    if (uSnap.data().litersLeft === 0) {
        console.log("   ✅ ผ่าน! โควตาเหลือ 0 ลิตร (ไม่ติดลบ) ถูกต้อง");
        passCount++;
    } else {
        console.log(`   ❌ ผิดพลาด! โควตาเหลือ ${uSnap.data().litersLeft} ลิตร (คาดหวัง: 0)`);
    }

    // ---------------------------------------------------------
    // Scenario 3: แอดมินเติมโควตาพิเศษให้ 1 ลิตร แล้วกด 0 ลิตร (ยกเลิก)
    // ---------------------------------------------------------
    console.log("\n▶️ [Scenario 3] ได้ extraQuota 1 ลิตร -> เริ่ม session แต่ยกเลิก (กดไป 0 ลิตร)");
    await updateDoc(doc(db, "users", testUid), { extraQuota: 1.0 });
    
    await setDoc(doc(db, "sessions", "SESSION_3"), { userUid: testUid, status: "confirmed" });
    await sleep(4000);
    await updateDoc(doc(db, "sessions", "SESSION_3"), { status: "finished", finalVol: 0 });
    await sleep(4000);

    uSnap = await getDoc(doc(db, "users", testUid));
    if (uSnap.data().litersLeft === 0 && uSnap.data().extraQuota === 1.0) {
        console.log("   ✅ ผ่าน! โควตาพิเศษกลับมาเป็น 1.0 ลิตร ถูกต้อง");
        passCount++;
    } else {
        console.log(`   ❌ ผิดพลาด! โควตาปกติ=${uSnap.data().litersLeft}, พิเศษ=${uSnap.data().extraQuota}`);
    }

    // ---------------------------------------------------------
    console.log("\n======================================================");
    if (passCount === 3) console.log("🎉 ยอดเยี่ยม! ระบบผ่านการทดสอบทุกสถานการณ์ 100%");
    else console.log(`⚠️ ระบบผ่านการทดสอบ ${passCount}/3 สถานการณ์`);

    // Cleanup
    await deleteDoc(doc(db, "users", testUid));
    await deleteDoc(doc(db, "sessions", "SESSION_1"));
    await deleteDoc(doc(db, "sessions", "SESSION_2"));
    await deleteDoc(doc(db, "sessions", "SESSION_3"));
    process.exit(0);
}

runTest();
