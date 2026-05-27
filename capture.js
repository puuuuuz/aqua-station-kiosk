const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
      headless: "new"
  });
  
  const outDir = '/Users/onelinkdeverlopment/.gemini/antigravity/brain/9a9a3e43-6b6f-469f-a37f-4bdcfdd24bb0/artifacts';

  // --- KIOSK ---
  const page = await browser.newPage();
  await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });

  const fileUrl = 'file:///Users/onelinkdeverlopment/.gemini/antigravity/playground/shimmering-orion-local/station-v121.html';
  console.log('Navigating to', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

  await new Promise(r => setTimeout(r, 4000));

  const standByPath = path.join(outDir, 'kiosk_standby.png');
  await page.screenshot({ path: standByPath });
  console.log('Saved', standByPath);

  await page.evaluate(() => {
    window.currentUserName = "คุณลูกค้า";
    window.maxLiters = 2.0;
    if (typeof window.showScreen === 'function') {
        window.showScreen('dispense');
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  const dispensePath = path.join(outDir, 'kiosk_dispense.png');
  await page.screenshot({ path: dispensePath });
  console.log('Saved', dispensePath);

  // --- LIFF ---
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  
  const liffUrl = 'file:///Users/onelinkdeverlopment/.gemini/antigravity/playground/shimmering-orion-local/www/liff-app.html';
  console.log('Navigating to', liffUrl);
  await page2.goto(liffUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  const liffHomePath = path.join(outDir, 'liff_home.png');
  await page2.screenshot({ path: liffHomePath });
  console.log('Saved', liffHomePath);

  await page2.evaluate(() => {
    if (typeof showScreen === 'function') {
        showScreen('dispensing');
        if (typeof updateLiffDispenseUI === 'function') {
            updateLiffDispenseUI(0.5, 2.0);
        }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  const liffDispensePath = path.join(outDir, 'liff_dispense.png');
  await page2.screenshot({ path: liffDispensePath });
  console.log('Saved', liffDispensePath);

  await browser.close();
})();
