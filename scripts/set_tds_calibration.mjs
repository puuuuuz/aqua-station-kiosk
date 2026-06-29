import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

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

async function setTdsCalibration() {
    const machineId   = process.argv[2];
    const calIn       = parseFloat(process.argv[3]);
    const calOut      = parseFloat(process.argv[4]);

    if (!machineId || isNaN(calIn) || isNaN(calOut)) {
        console.error("❌ Usage: node scripts/set_tds_calibration.mjs <machine_id> <cal_in> <cal_out>");
        console.error("   Example: node scripts/set_tds_calibration.mjs 5cc58f943af49e79 2.3335 4.1333");
        process.exit(1);
    }

    console.log(`\n🔬 Setting TDS Calibration for machine: ${machineId}`);
    console.log(`   TDS_CALIBRATION_IN  = ${calIn}`);
    console.log(`   TDS_CALIBRATION_OUT = ${calOut}\n`);

    const machineRef = doc(db, "machines", machineId);
    
    // เขียนค่า tdsCalibration เข้าไป
    await updateDoc(machineRef, {
        "tdsCalibration.in":  calIn,
        "tdsCalibration.out": calOut,
    });

    console.log(`✅ SUCCESS! TDS Calibration saved to Firebase`);
    console.log(`👉 The kiosk will pick up the new values on next data sync (no OTA needed)`);
    console.log(`\nVerify by checking Firebase Console:`);
    console.log(`   machines/${machineId}/tdsCalibration: { in: ${calIn}, out: ${calOut} }\n`);
    process.exit(0);
}

setTdsCalibration().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
