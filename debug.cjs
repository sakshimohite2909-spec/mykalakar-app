const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating to https://artist-hub-pro-main.vercel.app/register");
  try {
    await page.goto('https://artist-hub-pro-main.vercel.app/register', {waitUntil: 'domcontentloaded'});
    await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
    console.log("Navigation error:", e);
  }

  console.log("Finished waiting.");
  await browser.close();
})();
