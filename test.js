const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (error) => console.error("PAGE ERROR:", error.message));
  page.on("requestfailed", (request) =>
    console.log(
      "PAGE REQUEST FAILED:",
      request.failure().errorText,
      request.url(),
    ),
  );

  await page.goto("http://localhost:3000");

  try {
    await page.type("#age", "25");
    await page.type("#height", "180");
    await page.type("#weight", "75");
    await page.type("#bodyfat", "15");
    await page.type("#muscle", "35");

    await page.click("#calculateBtn");

    await new Promise((r) => setTimeout(r, 1000));

    const macroHtml = await page.$eval("#macroContainer", (el) => el.innerHTML);
    console.log("Macro length:", macroHtml.length);
  } catch (err) {
    console.error("SCRIPT ERROR:", err);
  }

  await browser.close();
})();
