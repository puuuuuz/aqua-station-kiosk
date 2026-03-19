const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const portPath = '/dev/cu.usbserial-A10QDIH7';
const bauds = [9600, 115200, 57600, 19200, 38400];

async function scan() {
  console.log(`🚀 Starting Serial Scan on ${portPath}...`);

  for (const baud of bauds) {
    console.log(`\n⏳ Testing Baud Rate: ${baud}...`);
    
    try {
      const port = new SerialPort({ path: portPath, baudRate: baud });
      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      let receivedData = false;
      
      const timeout = setTimeout(() => {
        if (!receivedData) {
          console.log(`❌ No data received at ${baud} in 3 seconds.`);
        }
        port.close();
      }, 3000);

      parser.on('data', (data) => {
        receivedData = true;
        console.log(`✅ SUCCESS! Data at ${baud}: "${data}"`);
        // If data looks like gibberish, continue to next baud
        if (data.includes('') || data.length < 1) {
          console.log(`⚠️ Data looks corrupt, trying next...`);
        } else {
          console.log(`🎯 Found correct Baud Rate: ${baud}`);
          process.exit(0);
        }
      });

      port.on('error', (err) => {
        console.error(`🔴 Port Error: ${err.message}`);
        clearTimeout(timeout);
      });

      // Wait for 3 seconds per test
      await new Promise(resolve => setTimeout(resolve, 3500));

    } catch (e) {
      console.log(`🔴 Failed to open port at ${baud}: ${e.message}`);
    }
  }
  
  console.log("\n🏁 Scan finished. No clear readable data found. (Make sure board is sending data)");
}

scan();
