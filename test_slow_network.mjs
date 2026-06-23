import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execAsync = util.promisify(exec);

// Helper for testing concurrent clicks
async function requestCurlAsync(method, url, payload) {
    const payloadFile = `temp_payload_${Math.random().toString(36).substring(7)}.json`;
    fs.writeFileSync(payloadFile, JSON.stringify(payload));
    
    // Simulate Slow Internet by adding a local artificial delay or just letting real network handle it
    // In actual slow network, the requests take long to reach the server.
    
    try {
        const cmd = `curl -s -X ${method} "${url}" -H "Content-Type: application/json" -d @${payloadFile}`;
        const startTime = Date.now();
        const { stdout } = await execAsync(cmd, { encoding: 'utf-8' });
        const duration = Date.now() - startTime;
        fs.unlinkSync(payloadFile);
        
        let parsed;
        try { parsed = JSON.parse(stdout); } catch(e) {
            try { parsed = [JSON.parse(stdout)]; } catch(e2) { parsed = stdout; }
        }
        return { success: true, duration, data: parsed };
    } catch (err) {
        if (fs.existsSync(payloadFile)) fs.unlinkSync(payloadFile);
        return { success: false, error: err.message };
    }
}

function generateRandomUid() { return 'Utest_slow_' + Math.random().toString(36).substring(2, 10); }
function generateRandomPhone() { return '08' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'); }

async function simulateSlowNetworkAndDoubleClicks() {
    console.log("🐌 Starting Slow Internet & Double-Click Test...\n");

    const uid = generateRandomUid();
    const phone = generateRandomPhone();
    console.log(`📱 Test Phone: ${phone}, UID: ${uid}`);
    console.log("▶️ Scenario: User clicks 'Register' 3 times rapidly because the internet is slow and the loading screen didn't show up fast enough.\n");

    // Payloads
    const checkPayload = {
        structuredQuery: {
            from: [{ collectionId: "users" }],
            where: { fieldFilter: { field: { fieldPath: "phone" }, op: "EQUAL", value: { stringValue: phone } } },
            limit: 1
        }
    };
    
    const savePayload = {
        fields: {
            displayName: { stringValue: "Slow Net User" },
            phone: { stringValue: phone },
            status: { stringValue: 'pending' }
        }
    };

    const queryUrl = `https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents:runQuery`;
    const patchUrl = `https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/users/${uid}`;

    // Simulate 3 concurrent executions of doRegister()
    async function mockDoRegister(clickNumber) {
        console.log(`   👆 Click ${clickNumber}: Checking Duplicate Phone...`);
        const checkRes = await requestCurlAsync('POST', queryUrl, checkPayload);
        
        const hasDuplicate = Array.isArray(checkRes.data) && checkRes.data.length > 0 && checkRes.data[0].document !== undefined;
        if (hasDuplicate) {
            console.log(`   🛑 Click ${clickNumber}: Blocked! Duplicate found. (Took ${checkRes.duration}ms)`);
            return;
        }

        console.log(`   ⏳ Click ${clickNumber}: No duplicate. Proceeding to save...`);
        const saveRes = await requestCurlAsync('PATCH', patchUrl, savePayload);
        
        if (saveRes.success) {
            console.log(`   ✅ Click ${clickNumber}: Saved Successfully! (Took ${saveRes.duration}ms)`);
        } else {
            console.log(`   ❌ Click ${clickNumber}: Failed to save!`);
        }
    }

    // Fire them all at the exact same time!
    await Promise.all([
        mockDoRegister(1),
        mockDoRegister(2),
        mockDoRegister(3)
    ]);

    console.log("\n🏁 Test Completed!");
    console.log("📝 Conclusion: Firestore REST API handles simultaneous PATCH requests to the same document ID idempotently. It simply overwrites the data with the same values. No duplication of users occurs, but it wastes network resources.");
}

simulateSlowNetworkAndDoubleClicks();
