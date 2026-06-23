import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function run() {
    console.log("🔍 กำลังค้นหาข้อมูลจากบางส่วนของชื่อและ UID...");
    
    // ดึงผู้ใช้ทั้งหมดมาค้นหาแบบยืดหยุ่น (เผื่อมีเว้นวรรคผิดปกติ)
    const snap = await getDocs(collection(db, "users"));
    let found = false;
    
    for (const userDoc of snap.docs) {
        const data = userDoc.data();
        const uid = userDoc.id;
        const name = data.name || "";
        
        // ค้นหาคำว่า "สิริพร" หรือ UID ที่ขึ้นต้นด้วย "U1fcd9a1"
        if (name.includes("สิริพร") || uid.startsWith("U1fcd9a1")) {
            found = true;
            console.log(`✅ พบสมาชิก: ${name} (UID: ${uid})`);
            console.log(`   โควตาเดิม: ${data.litersLeft} ลิตร`);
            
            await updateDoc(doc(db, "users", uid), {
                litersLeft: 0
            });
            
            console.log(`   👉 อัปเดตโควตาใหม่เป็น: 0 ลิตร เรียบร้อยแล้ว`);
        }
    }
    
    if (!found) {
        console.log("❌ ค้นหาแบบกว้างแล้วก็ยังไม่พบข้อมูล โปรดตรวจสอบ UID ที่ Firebase Console โดยตรงครับ");
    }
    process.exit(0);
}

run();
