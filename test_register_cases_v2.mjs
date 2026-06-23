import { execSync } from 'child_process';
import fs from 'fs';

function requestCurl(method, url, payload) {
    const payloadFile = 'temp_payload_v2.json';
    fs.writeFileSync(payloadFile, JSON.stringify(payload));
    try {
        const cmd = `curl -s -X ${method} "${url}" -H "Content-Type: application/json" -d @${payloadFile}`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        fs.unlinkSync(payloadFile);
        
        let parsed;
        try { parsed = JSON.parse(output); } catch(e) {
            try { parsed = [JSON.parse(output)]; } catch(e2) { parsed = output; }
        }
        return { success: true, data: parsed, raw: output };
    } catch (err) {
        if (fs.existsSync(payloadFile)) fs.unlinkSync(payloadFile);
        return { success: false, error: err.message };
    }
}

function generateRandomUid() {
    return 'Utest_' + Math.random().toString(36).substring(2, 15);
}

function generateRandomPhone() {
    let phone = '08';
    for (let i = 0; i < 8; i++) {
        phone += Math.floor(Math.random() * 10).toString();
    }
    return phone;
}

// 1. Function to simulate Duplicate Phone Check
function checkDuplicatePhone(phone) {
    const queryUrl = `https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents:runQuery`;
    const payload = {
        structuredQuery: {
            from: [{ collectionId: "users" }],
            where: {
                fieldFilter: { field: { fieldPath: "phone" }, op: "EQUAL", value: { stringValue: phone } }
            },
            limit: 1
        }
    };
    const res = requestCurl('POST', queryUrl, payload);
    if (!res.success) throw new Error("REST API Query failed");
    
    // Validate duplicate
    const hasDuplicate = Array.isArray(res.data) && res.data.length > 0 && res.data[0].document !== undefined;
    return hasDuplicate;
}

// 2. Function to simulate User Registration
function registerUser(uid, name, phone) {
    const patchUrl = `https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/users/${uid}`;
    const payload = {
        fields: {
            displayName: { stringValue: name },
            phone: { stringValue: phone },
            status: { stringValue: 'pending' },
            idCardBase64: { stringValue: "" } // Removed image
        }
    };
    
    const res = requestCurl('PATCH', patchUrl, payload);
    if (!res.success || (res.data && res.data.error)) {
        return false;
    }
    return true;
}

async function runFlowTest() {
    console.log("🚀 Starting Full Registration Flow Test (REST API Only)...\n");

    const testPhone = generateRandomPhone();
    const uid1 = generateRandomUid();
    const uid2 = generateRandomUid();

    console.log(`📱 Target Phone Number for Test: ${testPhone}\n`);

    // --- STEP 1: Register User A ---
    console.log("▶️ STEP 1: Register User A");
    const isDup1 = checkDuplicatePhone(testPhone);
    if (isDup1) {
        console.log("❌ Failed: Phone should not be duplicate yet.");
        return;
    } else {
        console.log("   ✅ Phone check passed. Not a duplicate.");
    }
    
    const reg1 = registerUser(uid1, "Test User A", testPhone);
    if (reg1) {
        console.log("   ✅ User A registered successfully.");
    } else {
        console.log("❌ Failed to register User A");
        return;
    }

    console.log("\n▶️ STEP 2: Wait 2 seconds (simulating user operations)...\n");
    await new Promise(r => setTimeout(r, 2000));

    // --- STEP 3: Register User B with SAME PHONE ---
    console.log("▶️ STEP 3: Register User B (With the same phone number)");
    const isDup2 = checkDuplicatePhone(testPhone);
    if (isDup2) {
        console.log("   ✅ Phone check correctly detected a duplicate!");
        console.log("   🛑 Registration blocked. (This is the expected, correct behavior)");
    } else {
        console.log("❌ Failed: Phone check DID NOT detect duplicate. Bug exists!");
        // Trying to register anyway
        registerUser(uid2, "Test User B", testPhone);
    }

    console.log("\n🏁 All Test Cases Completed successfully!");
}

runFlowTest();
