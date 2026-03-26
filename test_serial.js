/**
 * 🔌 Full Protocol Test — Start / Stop / End / Read
 * รัน: node test_serial.js
 */
const { SerialPort } = require('serialport');

const PORT = '/dev/cu.usbserial-AB0NRLBB';
const BAUD = 9600;

// Protocol constants
const STX = 0x02, MY_ADD = 0x01, MY_TYPE1 = 0x4D, ETX = 0x03;
const CMD_C6 = 0xC6; // 198 (from hex comment)
const CMD_C3 = 0xC3; // 195 (from decimal comment)
const AMOUNT = 0x64; // 100

// Commands
const CMDS = {
  START_C6: { cmd: CMD_C6, data: [0x53, 0x00, AMOUNT], label: 'START (0xC6)' },
  START_C3: { cmd: CMD_C3, data: [0x53, 0x00, AMOUNT], label: 'START (195 / 0xC3)' },
  READ_C6:  { cmd: CMD_C6, data: [0x52, 0x00, AMOUNT], label: 'READ (0xC6)' },
  READ_C3:  { cmd: CMD_C3, data: [0x52, 0x00, AMOUNT], label: 'READ (195 / 0xC3)' },
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
  console.log(`\n📥 RX ตอบกลับ! #${rxCount}: ${hex}`);
  console.log('🎉 บอร์ดตอบสนองแล้ว!');
});

port.on('error', err => console.error('🔴 ERROR:', err.message));

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendCmd(name) {
  const c = CMDS[name];
  const pkt = buildPacket(c.cmd, c.data);
  console.log(`\n📤 TX → ${c.label}`);
  console.log(`   HEX: ${hexStr(pkt)}`);
  await new Promise(r => port.write(pkt, r));
  await wait(2000); // รอ response 2 วิ
}

async function runTests() {
  console.log('ลองส่ง Command ด้วย 0xC6 (ตามคู่มือ Hex)');
  await sendCmd('START_C6');
  await sendCmd('READ_C6');

  console.log('-----------------------------------');
  console.log('ลองส่ง Command ด้วย 0xC3 (คือเลข 195 ตามคู่มือบรรทัดบน)');
  await sendCmd('START_C3');
  await sendCmd('READ_C3');

  console.log(`\n${'─'.repeat(40)}`);
  if (rxCount === 0) {
    console.log('⚠️ ไม่มี Response จากบอร์ดเลย');
  }
  port.close(() => process.exit(0));
}
