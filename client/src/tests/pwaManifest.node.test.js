import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manifestUrl = new URL("../../public/manifest.webmanifest", import.meta.url);

test("PWA manifest parse edilebilir ve ürün kimliği doğrudur", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestUrl, "utf8"));

  assert.equal(manifest.name, "Yapay Zeka Destekli Yaşam Koçu");
  assert.equal(manifest.short_name, "Yaşam Koçu");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "tr");
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length >= 2);
  assert.ok(manifest.icons.every((icon) => icon.src && icon.type === "image/svg+xml"));
});

test("PWA manifest eski proje adı veya mojibake izi taşımaz", () => {
  const raw = fs.readFileSync(manifestUrl, "utf8");
  assert.equal(/MoodLens|tezv2|TezFinal/i.test(raw), false);
  assert.equal(/[\u00c2-\u00c5\uFFFD]|\u011f\u0178|\u00e2\u20ac/.test(raw), false);
});
