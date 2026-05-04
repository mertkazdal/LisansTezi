import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const REPORT_ROOT = path.resolve("C:/Users/erayu/Desktop/tez1/tezFinal/docs/tez-raporu-1");
const ASSETS_DIR = path.join(REPORT_ROOT, "assets");
const SCREENSHOT_DIR = path.join(ASSETS_DIR, "screenshots");
const DEMO_IMAGE_PATH = path.join(ASSETS_DIR, "demo-selfie.png");
const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:5000";

const BROWSER_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const browserPath = await resolveBrowserPath();
  const demoData = await prepareDemoData();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    defaultViewport: { width: 1440, height: 1600, deviceScaleFactor: 1.2 },
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    await capturePublicPage(browser, "/", "01-home");
    await capturePublicPage(browser, "/login", "02-login");
    await capturePublicPage(browser, "/register", "03-register");
    await captureAnalyzePage(browser, demoData);
    await captureAuthedPage(browser, `/result/${demoData.resultHistoryId}`, "05-result", demoData);
    await captureAuthedPage(browser, "/history", "06-history", demoData);
    await captureAuthedPage(browser, "/profile", "07-profile", demoData);
    await captureMetricsPage(browser);
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    screenshots: [
      "01-home.png",
      "02-login.png",
      "03-register.png",
      "04-analyze.png",
      "05-result.png",
      "06-history.png",
      "07-profile.png",
      "08-metrics.png",
    ],
    demoUser: demoData.user,
    resultHistoryId: demoData.resultHistoryId,
  }, null, 2));
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

  throw new Error("No Chrome/Edge executable was found for screenshot capture.");
}

async function prepareDemoData() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const user = {
    username: `rapor${timestamp}`,
    email: `rapor.${timestamp}@example.com`,
    password: "Test123!",
  };

  const registerResponse = await fetchJson(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  const token = registerResponse.token;
  const storedUser = {
    id: registerResponse.userId,
    username: registerResponse.username,
    email: registerResponse.email,
    role: registerResponse.role,
    isAdmin: Boolean(registerResponse.isAdmin),
  };

  const imageBase64 = await fs.readFile(DEMO_IMAGE_PATH, "base64");
  const scenarios = [
    {
      text: "Son gunlerde hem daha dengeli hem de gelecege karsi umutlu hissediyorum.",
      reasonText: "Yeni hedefler belirledim ve bunlara odaklanmak bana iyi geliyor.",
      feedback: {
        overallRating: 5,
        analysisAccuracyRating: 5,
        recommendationQualityRating: 4,
        helpful: true,
        wouldReuse: true,
        comment: "Sonuc ve oneriler rapor gostermesi icin gayet tatmin edici.",
      },
    },
    {
      text: "Bir yandan yorgun hissediyorum ama toparlanmak icin motivasyonum da var.",
      reasonText: "Yoğun bir donem geciriyorum fakat kontrolu tekrar kazandigimi hissediyorum.",
      feedback: {
        overallRating: 4,
        analysisAccuracyRating: 4,
        recommendationQualityRating: 5,
        helpful: true,
        wouldReuse: true,
        comment: "Metrics ekraninda veri olusmasi icin ek geri bildirim.",
      },
    },
  ];

  const historyIds = [];
  for (const scenario of scenarios) {
    const analysis = await fetchJson(`${API_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-MoodLens-Language": "tr",
      },
      body: JSON.stringify({
        imageBase64,
        text: scenario.text,
        mimeType: "image/png",
        reasonText: scenario.reasonText,
      }),
    });

    historyIds.push(analysis.historyId);

    await fetchJson(`${API_URL}/api/feedback/${analysis.historyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(scenario.feedback),
    });
  }

  return {
    token,
    user: storedUser,
    resultHistoryId: historyIds[0],
  };
}

async function capturePublicPage(browser, route, fileName) {
  const page = await browser.newPage();
  try {
    await configurePage(page);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2" });
    await normalizePageForReport(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${fileName}.png`),
      fullPage: true,
    });
  } finally {
    await page.close();
  }
}

async function captureAnalyzePage(browser, demoData) {
  const page = await browser.newPage();
  try {
    await configurePage(page);
    await seedAuthState(page, demoData);
    await page.goto(`${BASE_URL}/analyze`, { waitUntil: "networkidle2" });
    await page.locator("textarea").fill(
      "Bugun kendimi daha dengeli, daha umutlu ve ilerlemeye acik hissediyorum.",
    );
    const fileInput = await page.$("input[type='file']");
    if (!fileInput) {
      throw new Error("Analyze page file input could not be found.");
    }

    await fileInput.uploadFile(DEMO_IMAGE_PATH);
    await page.click("input[type='checkbox']");
    await normalizePageForReport(page);
    await delay(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-analyze.png"),
      fullPage: true,
    });
  } finally {
    await page.close();
  }
}

async function captureAuthedPage(browser, route, fileName, demoData) {
  const page = await browser.newPage();
  try {
    await configurePage(page);
    await seedAuthState(page, demoData);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2" });
    await normalizePageForReport(page);
    await delay(1500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${fileName}.png`),
      fullPage: true,
    });
  } finally {
    await page.close();
  }
}

async function captureMetricsPage(browser) {
  const page = await browser.newPage();
  try {
    await configurePage(page);
    await page.goto(`${BASE_URL}/metrics`, { waitUntil: "networkidle2" });
    await page.waitForFunction(
      () => document.body.innerText.includes("Detayli grafikler"),
      { timeout: 15000 },
    );
    await normalizePageForReport(page);
    await delay(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-metrics.png"),
      fullPage: true,
    });
  } finally {
    await page.close();
  }
}

async function configurePage(page) {
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
}

async function seedAuthState(page, demoData) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("tezfinal_user", JSON.stringify(user));
  }, demoData);
}

async function normalizePageForReport(page) {
  await page.evaluate(() => {
    const dateTimePattern = /(\b\d{1,2}\.\d{1,2}\.\d{4})\s+\d{1,2}:\d{2}(?::\d{2})?/g;
    const onlyTimePattern = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
    const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (treeWalker.nextNode()) {
      textNodes.push(treeWalker.currentNode);
    }

    for (const node of textNodes) {
      const original = node.textContent ?? "";
      let updated = original.replace(/TezFinal/g, "Tez");
      updated = updated.replace(/MoodLens/gi, "");
      updated = updated.replace(/tezv2/gi, "");
      updated = updated.replace(/\bX\b/g, "");
      updated = updated.replace(dateTimePattern, "$1");
      updated = updated.replace(onlyTimePattern, "");
      updated = updated.replace(/\s+\|\s*$/g, "");
      updated = updated.replace(/\s{2,}/g, " ");
      if (updated !== original) {
        node.textContent = updated;
      }
    }

    const candidates = Array.from(document.querySelectorAll("p, span, div, td"));
    for (const element of candidates) {
      const text = (element.textContent || "").trim();
      if (!text) {
        continue;
      }

      if (/^Son kayıt:\s*\d{1,2}\.\d{1,2}\.\d{4}$/.test(text)) {
        continue;
      }

      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
        element.style.display = "none";
      }

      if (/MoodLens|tezv2/i.test(text)) {
        element.style.display = "none";
      }
    }
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Request failed (${response.status}): ${payload}`);
  }

  return response.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
