import { expect, test } from "@playwright/test";

const cases = [
  { name: "website-home-desktop", url: "http://127.0.0.1:3000", viewport: { width: 1440, height: 1000 } },
  { name: "website-home-mobile", url: "http://127.0.0.1:3000", viewport: { width: 390, height: 844 } },
  { name: "website-home-tablet", url: "http://127.0.0.1:3000", viewport: { width: 768, height: 1024 } },
  { name: "calculators-home-desktop", url: "http://127.0.0.1:3001", viewport: { width: 1440, height: 1000 } },
  { name: "calculators-home-mobile", url: "http://127.0.0.1:3001", viewport: { width: 390, height: 844 } },
  { name: "calculators-home-tablet", url: "http://127.0.0.1:3001", viewport: { width: 768, height: 1024 } },
  { name: "emi-mobile", url: "http://127.0.0.1:3001/emi-calculator", viewport: { width: 390, height: 844 } },
  { name: "tools-home-mobile", url: "http://127.0.0.1:3002", viewport: { width: 390, height: 844 } },
  { name: "tools-home-desktop", url: "http://127.0.0.1:3002", viewport: { width: 1440, height: 1000 } },
  { name: "json-formatter-mobile", url: "http://127.0.0.1:3002/json-formatter", viewport: { width: 390, height: 844 } },
];

for (const item of cases) test(`${item.name} visual regression`, async ({ page }) => {
  await page.setViewportSize(item.viewport);
  await page.goto(item.url);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(`${item.name}.png`, { fullPage: true });
});
