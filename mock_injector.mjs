import fs from 'fs';

let content = fs.readFileSync('station-v121.html', 'utf-8');

const mockScript = `
<!-- MOCK BOARD FOR WEB TESTING -->
<script>
    if (typeof window.AndroidSerial === 'undefined') {
        console.warn("⚠️ MOCK MODE ENABLED: No AndroidSerial found.");
        window.isMockMode = true;
        
        let mockFlow = 0;
        let isDispensingMock = false;
        
        window.AndroidSerial = {
            getDeviceId: () => "MOCK-001",
            getAppVersion: () => "2.0.Mock",
            jsLog: (msg) => console.log("[MOCK] " + msg),
            openPort: (port, baud) => console.log("[MOCK] openPort " + port + " " + baud),
            sendHex: (hex) => {
                // C1 53 is start, C1 54 is stop
                if (hex.includes("C153") || hex.includes("C1 53")) {
                    isDispensingMock = true;
                    if (window.dispenseSession && !window.dispenseSession.paused) {
                        mockFlow = 0; // reset flow on fresh start
                    }
                } else if (hex.includes("C154") || hex.includes("C1 54")) {
                    isDispensingMock = false;
                } else if (hex.includes("C150") || hex.includes("C1 50")) {
                    // poll, just ignore and let setInterval handle it
                }
            }
        };

        // Create UI panel for mock testing
        window.addEventListener('load', () => {
            const panel = document.createElement('div');
            panel.style.position = 'fixed';
            panel.style.bottom = '10px';
            panel.style.left = '10px';
            panel.style.background = 'rgba(0,0,0,0.8)';
            panel.style.color = 'white';
            panel.style.padding = '10px';
            panel.style.borderRadius = '10px';
            panel.style.zIndex = '999999';
            panel.style.fontFamily = 'monospace';
            panel.innerHTML = \`
                <div style="font-weight:bold; margin-bottom:5px; color:#f1c40f;">🛠️ MOCK KIOSK</div>
                <div style="font-size:12px;">Flow: <span id="mockFlowVal">0</span></div>
                <button id="mockPulseBtn" style="margin-top:5px; padding:5px; background:#3498db; color:white; border:none; border-radius:3px; cursor:pointer;">+50 Pulses (Manual)</button>
            \`;
            document.body.appendChild(panel);

            document.getElementById('mockPulseBtn').addEventListener('click', () => {
                if (isDispensingMock) mockFlow += 50;
            });
        });

        // Emit mock telemetry every 300ms
        setInterval(() => {
            if (isDispensingMock) {
                mockFlow += 20; // Auto flow simulation
                const flowEl = document.getElementById('mockFlowVal');
                if (flowEl) flowEl.innerText = mockFlow;
            }
            
            let p = new Array(21).fill(0);
            p[0] = 0x02;
            p[1] = 0xC1;
            p[2] = 0x00;
            p[3] = 0x0E;
            p[4] = 0x00;
            p[5] = 0xC1;
            p[6] = 0x4E; // level L
            p[7] = 0x4E; // level H (0x4E = N = Not empty)
            p[8] = mockFlow & 0xFF;
            p[9] = (mockFlow >> 8) & 0xFF;
            p[10] = 120 & 0xFF; // TDS IN
            p[11] = 0;
            p[12] = 15 & 0xFF; // TDS OUT
            p[13] = 0;
            p[14] = 0;
            p[15] = 0;
            p[16] = 0;
            p[17] = 0;
            p[18] = 0x4E; // Tap Water (0x4E = N = OK)
            p[19] = 0;
            
            let bcc = 0;
            for(let i=0; i<20; i++) bcc ^= p[i];
            p[20] = bcc;
            
            let hexStr = p.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
            if (typeof window.onSerialReceiveHex === 'function') {
                window.onSerialReceiveHex(hexStr);
            }
        }, 300);
    }
</script>
`;

if (!content.includes('MOCK BOARD FOR WEB TESTING')) {
    content = content.replace('</head>', mockScript + '\n</head>');
    fs.writeFileSync('station-v121.html', content);
    console.log('✅ Injected mock script into station-v121.html');
} else {
    console.log('⚠️ Mock script already exists in station-v121.html');
}
