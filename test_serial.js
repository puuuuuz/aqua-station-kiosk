/**
 * 🔌 Full Protocol Test — Start / Stop / End / Read
 * รัน: node test_serial.js
 */
const { SerialPort } = require('serialport');

const PORT = '/dev/cu.usbserial-AB0NRLBB';
const BAUD = 9600;

// Protocol constants
const STX = 0x02, MY_ADD = 0x01, MY_TYPE1 = 0x4D, ETX = 0x03;
const CMD  = 0xC6;
const AMOUNT = 0x64; // 100

// Commands
const CMDS = {
  READ:  { label: 'READ',  data: [0x52, 0x00, AMOUNT] }, // 'R'
  START: { label: 'START', data: [0x53, 0x00, AMOUNT] }, // 'S'
  STOP:  { label: 'STOP',  data: [0x50, 0x00, AMOUNT] }, // 'P'
  END:   { label: 'END',   data: [0x45, 0x00, AMOUNT] }, // 'E'
};

function buildPacket(command1, dataArray = []) {
  let pkt = [], bcc = 0;
  const push = (b) => { pkt.push(b); bcc ^= b; };
  push(STX); push(MY_ADD);
  const len = dataArray.length + 1;
  push((len >> 8) & 0xFF); push(len & 0xFF);
  push(MY_TYPE1); push(command1);
  dataArray.forEach(b => push(b));
  push(ETX);
  pkt.push(bcc); // BCC ไม่ XOR ตัวเอง
  return Buffer.from(pkt);
}

function hexStr(buf) {
  return [...buf].map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
}

const port = new SerialPort({ path: PORT, baudRate: BAUD }, err => {
  if (err) { console.error('❌ OPEN ERROR:', err.message); process.exit(1); }
  console.log(`✅ PORT OPENED: ${PORT} @ ${BAUD}\n`);
  runTests();
});

let rxCount = 0;
port.on('data', chunk => {
  rxCount++;
  const hex = hexStr(chunk);
  // ถอดรหัส packet ที่ได้รับ
  const bytes = [...chunk];
  const stxIdx = bytes.indexOf(STX);
  if (stxIdx !== -1 && bytes.length >= 8) {
    const cmd  = bytes[5];
    const data = bytes.slice(6, bytes.length - 2);
    const text = data.map(b => String.fromCharCode(b)).join('').trim();
    console.log(`📥 RX #${rxCount}: ${hex}`);
    console.log(`   ↳ CMD: 0x${cmd.toString(16).toUpperCase()} | PAYLOAD: "${text}" [${data.map(b=>'0x'+b.toString(16).toUpperCase()).join(',')}]`);
  } else {
    console.log(`📥 RX RAW #${rxCount}: ${hex}`);
  }
});

port.on('error', err => console.error('🔴 ERROR:', err.message));

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendCmd(name) {
  const c = CMDS[name];
  const pkt = buildPacket(CMD, c.data);
  console.log(`\n📤 TX → ${c.label}: ${hexStr(pkt)}`);
  await new Promise(r => port.write(pkt, r));
  await wait(2000); // รอ response 2 วิ
}

async function runTests() {
  // Step 1: READ ก่อน — ถามสถานะบอร์ด
  await sendCmd('READ');
  
  // Step 2: START
  await sendCmd('START');

  // Step 3: READ อีกครั้งหลัง START
  await sendCmd('READ');

  // Step 4: STOP
  await sendCmd('STOP');

  // Step 5: END
  await sendCmd('END');

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`📊 สรุป: RX ทั้งหมด ${rxCount} packets`);
  if (rxCount === 0) {
    console.log('⚠️  ไม่มี Response จากบอร์ดเลย');
    console.log('   → ตรวจสอบ: 1) ไฟบอร์ด  2) สาย TX/RX ถูกต้องไหม  3) Command ถูกไหม');
  } else {
    console.log('✅ Board ตอบกลับได้แล้ว!');
  }
  port.close(() => process.exit(0));
}
