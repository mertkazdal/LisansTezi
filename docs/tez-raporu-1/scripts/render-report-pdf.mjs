import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve("C:/Users/erayu/Desktop/tez1/tezFinal/docs/tez-raporu-1");
const BROWSER_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

async function main() {
  const inputHtml = process.argv[2];
  const outputPdf = process.argv[3];

  if (!inputHtml || !outputPdf) {
    throw new Error("Usage: node render-report-pdf.mjs <inputHtml> <outputPdf>");
  }

  const browserPath = await resolveBrowserPath();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileUrl(path.resolve(inputHtml)), {
      waitUntil: "networkidle2",
    });
    await page.pdf({
      path: path.resolve(outputPdf),
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });
  } finally {
    await browser.close();
  }
}

async function resolveBrowserPath() {
  for (const candidate of BROWSER_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Continue.
    }
  }

  throw new Error("No Chrome/Edge executable was found.");
}

function pathToFileUrl(targetPath) {
  const normalized = targetPath.replace(/\\/g, "/");
  return `file:///${normalized}`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
