import assert from "node:assert/strict";
import test from "node:test";
import { downloadResultSummaryCard } from "../lib/resultShareCard.js";

function createCanvasContextRecorder() {
  const fillTexts = [];

  const gradient = {
    addColorStop() {},
  };

  const context = {
    fillTexts,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    arcTo() {},
    fill() {},
    stroke() {},
    fillRect() {},
    createLinearGradient() {
      return gradient;
    },
    createRadialGradient() {
      return gradient;
    },
    measureText(text) {
      return { width: String(text).length * 14 };
    },
    fillText(text) {
      fillTexts.push(String(text));
    },
  };

  return context;
}

test.beforeEach(() => {
  const context = createCanvasContextRecorder();
  let clicked = false;
  let downloadName = "";

  globalThis.__shareCardTestState = {
    context,
    get clicked() {
      return clicked;
    },
    get downloadName() {
      return downloadName;
    },
  };

  globalThis.document = {
    createElement(tagName) {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext() {
            return context;
          },
          toBlob(callback) {
            callback(new Blob(["yasam-kocu"], { type: "image/png" }));
          },
        };
      }

      if (tagName === "a") {
        return {
          href: "",
          set download(value) {
            downloadName = value;
          },
          get download() {
            return downloadName;
          },
          click() {
            clicked = true;
          },
          remove() {},
        };
      }

      return {};
    },
    body: {
      appendChild() {},
    },
  };

  globalThis.URL = {
    createObjectURL() {
      return "blob:yasam-kocu-test";
    },
    revokeObjectURL() {},
  };
});

test.afterEach(() => {
  delete globalThis.document;
  delete globalThis.URL;
  delete globalThis.__shareCardTestState;
});

test("paylaşılabilir özet kartı PNG indirme akışını çalıştırır", async () => {
  await downloadResultSummaryCard(
    { confidence: 0.87, userText: "Bu metnin tamamı görsel karta yazılmamalı." },
    { label: "Sakin", accentColor: "#2dd4bf", coachPrompt: "Bugün sakin bir tempo iyi gelebilir." },
  );

  assert.equal(globalThis.__shareCardTestState.clicked, true);
  assert.equal(globalThis.__shareCardTestState.downloadName, "yasam-kocu-analiz-ozeti.png");
});

test("özet kartı kişisel kullanıcı metnini doğrudan dışa aktarmaz", async () => {
  const sensitiveText = "Çok kişisel ve paylaşılmaması gereken uzun kullanıcı metni";

  await downloadResultSummaryCard(
    { confidence: 91, userText: sensitiveText },
    { label: "Motive", accentColor: "#22c55e" },
  );

  assert.equal(globalThis.__shareCardTestState.context.fillTexts.includes(sensitiveText), false);
  assert.equal(
    globalThis.__shareCardTestState.context.fillTexts.some((text) => text.includes("Yapay Zeka Destekli Yaşam Koçu")),
    true,
  );
});
