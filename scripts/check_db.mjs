import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    const machineId = "5cc58f943af49e79";
    const ref = doc(db, "machines", machineId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        console.log("Firebase DB tdsCalibration for", machineId, "is:");
        console.log(snap.data().tdsCalibration);
    } else {
        console.log("Doc not found");
    }
    process.exit(0);
}

check();
