import assert from "node:assert/strict";
import test from "node:test";
import { EMOTION_META, getEmotionMeta, getEmotionOptions } from "../lib/emotions.js";

const baseEmotionKeys = [
  "happy",
  "sad",
  "angry",
  "anxious",
  "excited",
  "calm",
  "tired",
  "stressed",
  "nostalgic",
  "motivated",
  "hopeful",
  "overwhelmed",
];

test("10'lu temel duygu sistemi meta içinde bulunur", () => {
  for (const key of baseEmotionKeys) {
    assert.ok(EMOTION_META[key], `${key} meta eksik`);
    assert.equal(typeof EMOTION_META[key].label, "string");
    assert.match(EMOTION_META[key].accentColor, /^#[0-9a-f]{6}$/i);
  }
});

test("bilinen duygu meta verisi kullanıcıya gösterilecek alanları döndürür", () => {
  const meta = getEmotionMeta("happy");
  assert.equal(meta.label, "Mutlu");
  assert.ok(meta.message);
  assert.ok(meta.resultTone);
  assert.ok(meta.coachPrompt);
});

test("bilinmeyen duygu UI'ı kırmayan fallback üretir", () => {
  const meta = getEmotionMeta("new_emotion");
  assert.equal(meta.key, "new_emotion");
  assert.equal(meta.label, "new emotion");
  assert.ok(meta.accentColor);
  assert.ok(meta.message);
});

test("İngilizce dil seçeneği duygu etiketlerini yerelleştirir", () => {
  const meta = getEmotionMeta("happy", "en");
  assert.equal(meta.label, "Happy");
  assert.match(meta.message, /positive energy/i);

  const unknown = getEmotionMeta(null, { language: "en" });
  assert.equal(unknown.label, "Unknown");
});

test("emotion options boş değildir ve mojibake izi taşımaz", () => {
  const options = getEmotionOptions();
  assert.ok(options.length >= baseEmotionKeys.length);
  assert.equal(/[\u00c2-\u00c5\uFFFD]|\u011f\u0178|\u00e2\u20ac/.test(JSON.stringify(options)), false);
});
