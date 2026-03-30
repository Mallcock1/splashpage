import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const outputDir = path.join(process.cwd(), "assets", "images", "hero-stills");

const sceneFiles = [
  { index: 0, filename: "hero-anim-1-orbital-trading.png" },
  { index: 1, filename: "hero-anim-2-lunar-relay.png" },
  { index: 2, filename: "hero-anim-3-eclipse-transfer.png" },
  { index: 3, filename: "hero-anim-4-ground-to-drone.png" }
];

test("export preview-5 hero stills", async ({ page }) => {
  fs.mkdirSync(outputDir, { recursive: true });

  await page.addInitScript(() => {
    window.__NEOWATT_EXPORT_FLAT_CORNERS = true;
    window.__NEOWATT_EXPORT_MAX_DPR = 6;
    window.__NEOWATT_PRINT_EXPORT = true;
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const visualSlot = page.locator("#hero-visual-slot");
  await expect(visualSlot).toBeVisible();

  const dots = page.locator("#hero-visual-slot .hero-visual-dot");
  await expect(dots).toHaveCount(sceneFiles.length);

  await page.addStyleTag({
    content: `
      #hero-visual-slot .hero-visual-controls,
      #hero-visual-slot .hero-visual-dots {
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `
  });
  await page.waitForTimeout(500);

  const visualCanvas = page.locator("#hero-visual-slot canvas");
  await expect(visualCanvas).toBeVisible();

  for (const scene of sceneFiles) {
    await page.evaluate((idx) => {
      const node = document.querySelectorAll("#hero-visual-slot .hero-visual-dot")[idx];
      if (node instanceof HTMLElement) {
        node.click();
      }
    }, scene.index);
    await page.waitForTimeout(1800);
    const dataUrl = await page.evaluate(() => {
      const canvas = document.querySelector("#hero-visual-slot canvas");
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("Hero canvas not found");
      }
      return canvas.toDataURL("image/png");
    });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(path.join(outputDir, scene.filename), Buffer.from(base64, "base64"));
  }
});
