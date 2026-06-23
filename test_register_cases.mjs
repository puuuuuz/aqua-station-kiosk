import { execSync } from 'child_process';
import fs from 'fs';

function requestCurl(url, payload) {
    const payloadFile = 'temp_payload.json';
    fs.writeFileSync(payloadFile, JSON.stringify(payload));
    try {
        const cmd = `curl -s -X PATCH "${url}" -H "Content-Type: application/json" -d @${payloadFile}`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        fs.unlinkSync(payloadFile);
        
        let parsed = {};
        try { parsed = JSON.parse(output); } catch(e) {}
        
        // If there's an error object from google APIs, it usually means it failed
        if (parsed.error) {
            return { success: false, status: parsed.error.code, data: output };
        }
        return { success: true, status: 200, data: output };
    } catch (err) {
        if (fs.existsSync(payloadFile)) fs.unlinkSync(payloadFile);
        return { success: false, status: 500, data: err.message };
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

async function runTestCase(name, payload, uid) {
    console.log(`\n▶️ Running Test Case: ${name}`);
    const firestoreRestUrl = `https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/users/${uid}`;
    
    const response = requestCurl(firestoreRestUrl, payload);
    
    if (response.success) {
        console.log(`✅ Success`);
        return true;
    } else {
        console.log(`❌ Failed (Status ${response.status})`);
        console.log(`   Response: ${response.data.substring(0, 300)}...`);
        return false;
    }
}

async function runAllTests() {
    console.log("🚀 Starting Registration Test Cases (via Curl)...\n");

    // Test Case 1: Normal Registration
    const uid1 = generateRandomUid();
    const payload1 = {
        fields: {
            displayName: { stringValue: "Test Normal" },
            phone: { stringValue: generateRandomPhone() },
            status: { stringValue: 'pending' },
            idCardBase64: { stringValue: "" }
        }
    };
    await runTestCase("TC01 - Normal Registration", payload1, uid1);

    // Test Case 2: Missing Fields
    const uid2 = generateRandomUid();
    const payload2 = { fields: {} };
    await runTestCase("TC02 - Empty Data Registration", payload2, uid2);

    // Test Case 3: Oversized Image Base64 (>1MB limits of Firestore Document)
    const uid3 = generateRandomUid();
    const largeBase64 = "A".repeat(1500000); 
    const payload3 = {
        fields: {
            displayName: { stringValue: "Test Oversized" },
            idCardBase64: { stringValue: largeBase64 }
        }
    };
    await runTestCase("TC03 - Oversized Image (>1MB) Registration", payload3, uid3);

    // Test Case 4: Idempotency (Duplicate Request with same UID)
    const uid4 = "Utest_fixed_duplicate_uid";
    const payload4 = {
        fields: {
            displayName: { stringValue: "Test Duplicate 1" }
        }
    };
    await runTestCase("TC04.1 - Create Duplicate User", payload4, uid4);
    
    payload4.fields.displayName.stringValue = "Test Duplicate 2 (Overwritten)";
    await runTestCase("TC04.2 - Overwrite Duplicate User", payload4, uid4);

    console.log("\n🏁 All Test Cases Completed!");
}

runAllTests();
