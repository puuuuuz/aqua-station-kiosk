import fetch from 'node-fetch'; // Requires node-fetch if Node < 18, but Node 18+ has native fetch.

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomPhone() {
    let phone = '08';
    for (let i = 0; i < 8; i++) {
        phone += Math.floor(Math.random() * 10).toString();
    }
    return phone;
}

function generateRandomUid() {
    return 'Utest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function registerUser(index) {
    const uid = generateRandomUid();
    const name = `Test User ${index}`;
    const rawPhone = generateRandomPhone();
    const prov = 'กรุงเทพมหานคร';
    const dist = 'เขตจตุจักร';
    const subDist = 'แขวงจตุจักร';
    const idCardBase64 = ''; // empty for test

    const firestoreRestUrl = `https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/users/${uid}`;
    const payload = {
        fields: {
            displayName: { stringValue: name },
            fullName: { stringValue: name },
            phone: { stringValue: rawPhone },
            province: { stringValue: prov },
            district: { stringValue: dist },
            subdistrict: { stringValue: subDist },
            idCardBase64: { stringValue: idCardBase64 },
            lineUid: { stringValue: uid },
            status: { stringValue: 'pending' },
            photoUrl: { stringValue: 'https://example.com/avatar.png' },
            totalVol: { integerValue: "0" },
            registeredAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() }
        }
    };

    try {
        console.log(`[Test ${index}] Registering user: ${name} (Phone: ${rawPhone}, UID: ${uid})`);
        
        const startTime = Date.now();
        const res = await fetch(firestoreRestUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const duration = Date.now() - startTime;

        if (!res.ok) {
            const errText = await res.text();
            console.error(`❌ [Test ${index}] FAILED in ${duration}ms. Status: ${res.status}, Error: ${errText}`);
            return { success: false, error: errText, status: res.status };
        }

        const data = await res.json();
        console.log(`✅ [Test ${index}] SUCCESS in ${duration}ms.`);
        return { success: true, uid: uid };

    } catch (err) {
        console.error(`❌ [Test ${index}] EXCEPTION:`, err.message);
        return { success: false, error: err.message };
    }
}

async function runTests() {
    const totalTests = 10;
    let successCount = 0;
    let failCount = 0;

    console.log(`🚀 Starting registration test for ${totalTests} users...\n`);

    for (let i = 1; i <= totalTests; i++) {
        const result = await registerUser(i);
        if (result.success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Small delay to prevent rate limiting, though Firestore usually handles it well
        await delay(500); 
    }

    console.log('\n=======================================');
    console.log(`📊 Test Summary:`);
    console.log(`Total: ${totalTests}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('=======================================');
}

runTests();
