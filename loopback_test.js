/**
 * 🔁 Loopback Test — ต่อ TX กับ RX เข้าหากัน แล้วรันสคริปต์นี้
 * ถ้าได้รับข้อมูลที่เราส่งออกไปกลับมา = Serial TX/RX ทำงานได้ปกติ
 * 
 * รัน: node loopback_test.js
 */

const { SerialPort } = require('serialport');

const PORT = '/dev/cu.usbserial-AB0NRLBB';
const BAUD = 9600;

const TEST_PACKET = Buffer.from([0x02, 0x01, 0x00, 0x04, 0x4D, 0xC6, 0x53, 0x00, 0x64, 0x03, 0xB8]);

console.log('🔁 Loopback Test');
console.log('📌 วิธีทำ: เอาสาย TX ต่อเข้า RX บน FTDI Adapter ก่อนรันครับ\n');

const port = new SerialPort({ path: PORT, baudRate: BAUD }, (err) => {
  if (err) {
    console.error(`❌ เปิดพอร์ตไม่ได้: ${err.message}`);
    process.exit(1);
  }
  console.log(`✅ เปิดพอร์ต ${PORT} @ ${BAUD} สำเร็จ\n`);

  // รอสักครู่แล้วส่ง
  setTimeout(() => {
    const hex = [...TEST_PACKET].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    console.log(`📤 ส่ง TX: ${hex}`);
    console.log('⏳ รอ RX ตอบกลับมา...\n');

    port.write(TEST_PACKET, (err) => {
      if (err) console.error(`❌ TX Error: ${err.message}`);
    });
  }, 500);
});

// รอรับข้อมูล
let rxBuf = Buffer.alloc(0);
port.on('data', (chunk) => {
  rxBuf = Buffer.concat([rxBuf, chunk]);
  const hex = [...chunk].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  console.log(`📥 RX: ${hex}`);

  // เช็คว่า loop กลับมาตรงกับที่ส่งไหม
  if (rxBuf.length >= TEST_PACKET.length) {
    const received = rxBuf.slice(0, TEST_PACKET.length);
    const match = received.equals(TEST_PACKET);
    if (match) {
      console.log('\n🎉 LOOPBACK SUCCESS! TX/RX ทำงานได้ปกติครับ!');
      console.log('   → Serial Port ส่ง-รับข้อมูลได้ถูกต้อง ✅');
    } else {
      console.log('\n⚠️  ได้รับข้อมูล แต่ไม่ตรงกับที่ส่งออกไป');
      console.log('   TX:', [...TEST_PACKET].map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' '));
      console.log('   RX:', [...received].map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' '));
    }
    port.close();
    process.exit(0);
  }
});

port.on('error', (err) => console.error(`🔴 Error: ${err.message}`));

// Timeout 5 วิ
setTimeout(() => {
  console.log('⏰ Timeout 5 วิ — ไม่ได้รับข้อมูล RX กลับมาเลย');
  console.log('   → ตรวจสอบว่าต่อสาย TX ↔ RX ถูกต้องไหมครับ');
  port.close();
  process.exit(1);
}, 5000);
