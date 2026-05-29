/**
 * URL Evidence Screenshot Capture — Playwright-based
 *
 * Takes a full-page PNG screenshot of an infringing URL for court-admissible
 * evidence preservation. Extracts page metadata alongside the screenshot.
 */
import { chromium } from "playwright";
import { createHash } from "crypto";

const CHROMIUM_PATH =
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe";

export interface ScreenshotResult {
  buffer: Buffer;
  metadata: {
    title: string;
    description: string;
    publishedAt: string | null;
    author: string | null;
  };
}

export async function captureUrlScreenshot(url: string): Promise<ScreenshotResult> {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const buffer = await page.screenshot({ fullPage: true, type: "png" });

    const metadata = await page.evaluate(() => {
      const getMeta = (name: string) => {
        const el = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return el?.getAttribute("content") || null;
      };
      return {
        title: document.title || "",
        description:
          getMeta("description") || getMeta("og:description") || "",
        publishedAt: getMeta("article:published_time") || null,
        author: getMeta("author") || getMeta("article:author") || null,
      };
    });

    return { buffer, metadata };
  } finally {
    await context.close();
    await browser.close();
  }
}

export function bufferHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
