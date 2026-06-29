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
    const d = await getDoc(doc(db, "machines", "5cc58f943af49e79"));
    console.log(d.data());
    process.exit(0);
}
check();
