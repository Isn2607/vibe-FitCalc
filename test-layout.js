const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  await page.goto("http://localhost:3000");

  // Fill form
  await page.type("#age", "25");
  await page.type("#height", "180");
  await page.type("#weight", "75");
  await page.type("#bodyfat", "15");
  await page.type("#muscle", "35");

  await page.click("#calculateBtn");
  await new Promise((r) => setTimeout(r, 1000));

  // Get layout data
  const layout = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".dashboard-row"));
    return rows.map((row) => {
      const cards = Array.from(row.querySelectorAll(".card"));
      return cards.map((c) => ({
        class: c.className,
        height: c.getBoundingClientRect().height,
        width: c.getBoundingClientRect().width,
      }));
    });
  });

  console.log(JSON.stringify(layout, null, 2));

  await browser.close();
})();
