const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  await page.goto("http://localhost:3000");

  await page.type("#age", "25");
  await page.type("#height", "180");
  await page.type("#weight", "75");
  await page.type("#bodyfat", "15");
  await page.type("#muscle", "35");

  await page.click("#calculateBtn");
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: "screenshot.png" });
  await browser.close();
})();
