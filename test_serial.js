const { SerialPort } = require('serialport');

const PORT = '/dev/cu.usbserial-AB0NRLBB';
const BAUD = 9600;

// Protocol constants
const STX = 0x02, MY_ADD = 0x01, MY_TYPE1 = 0x4D, ETX = 0x03;
const CMD_C6 = 0xC6;
const AMOUNT = 0x64; // 100

function buildPacket(command1, dataArray = []) {
  let pkt = [], bcc = 0;
  const push = (b) => { pkt.push(b); bcc ^= b; };
  push(STX); push(MY_ADD);
  const len = dataArray.length + 1;
  push((len >> 8) & 0xFF); push(len & 0xFF);
  push(MY_TYPE1); push(command1);
  dataArray.forEach(b => push(b));
  push(ETX);
  pkt.push(bcc);
  return Buffer.from(pkt);
}

function hexStr(buf) {
  return [...buf].map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
}

const port = new SerialPort({ path: PORT, baudRate: BAUD }, err => {
  if (err) { console.error('❌ OPEN ERROR:', err.message); process.exit(1); }
  console.log(`\n✅ PORT OPENED: ${PORT} @ ${BAUD}\n`);
  startSpamming();
});

let rxCount = 0;
port.on('data', chunk => {
  rxCount++;
  const hex = hexStr(chunk);
  console.log(`\n📥 [!!!RX ${rxCount}!!!] บอร์ดตอบกลับแล้ว: ${hex} 🎉`);
});

port.on('error', err => console.error('🔴 ERROR:', err.message));

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startSpamming() {
  const readPkt = buildPacket(CMD_C6, [0x52, 0x00, AMOUNT]);
  const startPkt = buildPacket(CMD_C6, [0x53, 0x00, AMOUNT]);

  console.log('🔥 เริ่มยิง (SPAM) คำสั่ง READ สลับ START รัวๆ...');
  console.log('   (ลองสังเกตไฟที่บอร์ดว่ากระพริบรัวๆ ตามจังหวะไหม)');
  console.log('----------------------------------------------------');

  for (let i = 1; i <= 500; i++) {
    const pkt = (i % 2 === 0) ? readPkt : startPkt;
    const name = (i % 2 === 0) ? 'READ' : 'START';
    
    process.stdout.write(`\r📤 ยิงนัดที่ #${i} -> ${name} `);
    
    port.write(pkt);
    
    // หน่วงเวลา 200ms ต่อครั้ง (ยิง 5 ครั้งต่อวินาที)
    await wait(200); 
  }
  
  console.log('\n\n🛑 หยุดยิง (รวม 500 ครั้ง)');
  if (rxCount === 0) {
    console.log('⚠️ สรุปดุเดือด: บอร์ดไม่ตอบกลับมาแม้แต่ตัวเดียว (RX = 0)');
    console.log('🔥 แนะนำ: ลองขยับสายขั้วต่อ หรือ สลับสาย TX/RX ปลายทางครับ!');
  } else {
    console.log(`✅ สำเร็จ! บอร์ดตอบสนองทั้งหมด ${rxCount} ครั้ง`);
  }
  
  port.close(() => process.exit(0));
}
