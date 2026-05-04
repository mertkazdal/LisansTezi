import assert from "node:assert/strict";
import test from "node:test";
import tr from "../locales/tr.js";
import en from "../locales/en.js";

const criticalKeys = [
  "common.productName",
  "common.shortProductName",
  "common.loadingTitle",
  "navigation.home",
  "navigation.analyze",
  "navigation.history",
  "navigation.metrics",
  "navigation.login",
  "navigation.register",
  "footer.description",
  "profile.languageTitle",
  "home.heroTitle",
  "analyze.heroTitle",
  "result.confidenceScore",
  "metrics.kpis.total.label",
  "metrics.responseTrendTitle",
  "history.heroTitle",
  "auth.loginTitle",
  "profile.savedEyebrow",
  "pwa.offlineTitle",
  "pwa.onlineTitle",
];

test("Türkçe ve İngilizce çeviri kaynakları kritik anahtarları içerir", () => {
  for (const key of criticalKeys) {
    assert.equal(typeof getByPath(tr, key), "string", `TR missing: ${key}`);
    assert.equal(typeof getByPath(en, key), "string", `EN missing: ${key}`);
    assert.notEqual(getByPath(tr, key).trim(), "", `TR empty: ${key}`);
    assert.notEqual(getByPath(en, key).trim(), "", `EN empty: ${key}`);
  }
});

test("ürün adı iki dilde kontrollü şekilde tanımlıdır", () => {
  assert.equal(tr.common.productName, "Yapay Zeka Destekli Yaşam Koçu");
  assert.equal(tr.common.shortProductName, "Yaşam Koçu");
  assert.equal(en.common.productName, "AI-Powered Life Coach");
  assert.equal(en.common.shortProductName, "Life Coach");
});

test("çeviri kaynaklarında eski kaynak proje adı ve mojibake izi yoktur", () => {
  const serialized = JSON.stringify({ tr, en });
  assert.equal(/MoodLens|tezv2|TezFinal/i.test(serialized), false);
  assert.equal(hasMojibake(serialized), false);
});

function getByPath(source, path) {
  return path.split(".").reduce((value, segment) => value?.[segment], source);
}

function hasMojibake(value) {
  return /[\u00c2-\u00c5\uFFFD]|\u011f\u0178|\u00e2\u20ac/.test(value);
}
