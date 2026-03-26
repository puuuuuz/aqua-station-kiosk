/**
 * 🔌 Serial TX/RX Test — Aqua Station Board
 * พอร์ต: /dev/cu.usbserial-AB0NRLBB (board เชื่อม Mac)
 * Baud:  9600
 * 
 * รัน: node test_serial.js
 */

const { SerialPort } = require('serialport');

const PORT   = '/dev/cu.usbserial-AB0NRLBB';
const BAUD   = 9600;

// ── Protocol Constants (ตรงกับ C Code ของบอร์ด) ──
const STX      = 0x02;
const MY_ADD   = 0x01;
const MY_TYPE1 = 0x4D;
const ETX      = 0x03;

// ── สร้าง Packet แบบเดียวกับ IO_Data_Send() ──
function buildPacket(command1, dataArray = []) {
  const dataSize = dataArray.length;
  const packet = [];
  let bcc = 0;

  packet.push(STX);                          bcc ^= STX;
  packet.push(MY_ADD);                       bcc ^= MY_ADD;
  const len = dataSize + 1;
  packet.push((len >> 8) & 0xFF);            bcc ^= ((len >> 8) & 0xFF);
  packet.push(len & 0xFF);                   bcc ^= (len & 0xFF);
  packet.push(MY_TYPE1);                     bcc ^= MY_TYPE1;
  packet.push(command1);                     bcc ^= command1;
  for (const b of dataArray) {
    packet.push(b);                          bcc ^= b;
  }
  packet.push(ETX);                          bcc ^= ETX;
  packet.push(bcc);  // checksum

  return Buffer.from(packet);
}

// ── เปิดพอร์ต ──
const port = new SerialPort({ path: PORT, baudRate: BAUD }, (err) => {
  if (err) {
    console.error(`❌ ไม่สามารถเปิดพอร์ตได้: ${err.message}`);
    process.exit(1);
  }
  console.log(`✅ เปิดพอร์ต ${PORT} @ ${BAUD} baud สำเร็จ`);
  console.log('📡 รอรับข้อมูลจาก Board (RX)...\n');
});

// ── RX: รับข้อมูลจากบอร์ด แสดงเป็น HEX ──
let rxBuffer = Buffer.alloc(0);
port.on('data', (chunk) => {
  rxBuffer = Buffer.concat([rxBuffer, chunk]);
  let hex = chunk.toString('hex').toUpperCase().match(/.{1,2}/g).join(' ');
  console.log(`📥 RX: ${hex}`);

  // ตรวจว่ามี STX...ETX ครบไหม
  const stx = rxBuffer.indexOf(STX);
  const etx = rxBuffer.indexOf(ETX, stx + 1);
  if (stx !== -1 && etx !== -1 && rxBuffer.length > etx + 1) {
    const packet = rxBuffer.slice(stx, etx + 2); // +2 = ETX + BCC
    const cmd    = packet[5];
    let bcc = 0;
    for (let i = 0; i < packet.length - 1; i++) bcc ^= packet[i];
    const bccOk = bcc === packet[packet.length - 1];
    console.log(`   └─ CMD: 0x${cmd.toString(16).toUpperCase()}  BCC: ${bccOk ? '✅ OK' : '❌ ERROR'}`);
    rxBuffer = rxBuffer.slice(etx + 2); // เคลียร์ขบวนที่อ่านแล้ว
  }
});

port.on('error', (err) => {
  console.error(`🔴 Port Error: ${err.message}`);
});

// ── TX: ส่ง Packet ไปที่บอร์ดทุก 3 วินาที ──
// packet ตัวอย่าง: 0x02, 0x01, 0x00, 0x04, 0x4D, 0xC6, 0x53, 0x00, 0x64, 0x03, BCC
const TX_CMD  = 0xC6;
const TX_DATA = [0x53, 0x00, 0x64];

let txCount = 0;
function sendPacket() {
  const pkt = buildPacket(TX_CMD, TX_DATA);
  const hex = [...pkt].map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
  txCount++;
  port.write(pkt, (err) => {
    if (err) {
      console.log(`📤 TX #${txCount}: ❌ ERROR ${err.message}`);
    } else {
      console.log(`📤 TX #${txCount}: ${hex}`);
    }
  });
}

// รอ 1 วิหลังจากเปิดพอร์ต แล้วส่ง packet แรก
setTimeout(() => {
  sendPacket();
  setInterval(sendPacket, 3000); // ส่งทุก 3 วินาที
}, 1000);

console.log('⏹  กด Ctrl+C เพื่อหยุดครับ\n');
