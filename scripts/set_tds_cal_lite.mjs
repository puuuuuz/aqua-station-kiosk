import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore/lite";

const firebaseConfig = {
    apiKey: "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ",
    authDomain: "siam-circuit.firebaseapp.com",
    projectId: "siam-circuit"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const docRef = doc(db, "machines", "5cc58f943af49e79");
    await updateDoc(docRef, {
        "tdsCalibration.in": 0.47619,
        "tdsCalibration.out": 0.45977
    });
    console.log("Success with Lite SDK!");
    process.exit(0);
}
run();
