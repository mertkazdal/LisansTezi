import assert from "node:assert/strict";
import test from "node:test";
import {
  clearSavedRecommendations,
  createSavedRecommendationId,
  getSavedRecommendations,
  isRecommendationSaved,
  saveRecommendation,
  toggleSavedRecommendation,
} from "../lib/savedRecommendations.js";

function createLocalStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test.beforeEach(() => {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };

  globalThis.window = {
    localStorage: createLocalStorageMock(),
    dispatchEvent() {},
  };
});

test.afterEach(() => {
  delete globalThis.window;
  delete globalThis.CustomEvent;
});

test("boş storage boş öneri listesi döndürür", () => {
  assert.deepEqual(getSavedRecommendations(), []);
});

test("öneri kaydedilir ve tekrar kaydedilince duplicate oluşmaz", () => {
  const item = {
    type: "music",
    title: "Sakin Bir Sabah",
    subtitle: "Demo Sanatçı",
    reason: "Ruh halini dengelemek için seçildi.",
    sourceHistoryId: "history-1",
  };

  const firstSave = saveRecommendation(item);
  const secondSave = saveRecommendation(item);

  assert.equal(firstSave.length, 1);
  assert.equal(secondSave.length, 1);
  assert.equal(secondSave[0].title, "Sakin Bir Sabah");
  assert.equal(isRecommendationSaved(secondSave[0].id), true);
});

test("toggle öneriyi kaydeder ve ikinci çağrıda kaldırır", () => {
  const item = {
    type: "book",
    title: "Duygu Günlüğü",
    subtitle: "Yaşam Koçu",
    sourceHistoryId: "history-2",
  };

  const saved = toggleSavedRecommendation(item);
  assert.equal(saved.saved, true);
  assert.equal(saved.items.length, 1);

  const removed = toggleSavedRecommendation(item);
  assert.equal(removed.saved, false);
  assert.equal(removed.items.length, 0);
});

test("bozuk JSON uygulamayı kırmaz", () => {
  window.localStorage.setItem("yasam_kocu_saved_recommendations", "{bozuk-json");
  assert.deepEqual(getSavedRecommendations(), []);
});

test("deterministic id Türkçe karakterleri stabil normalize eder", () => {
  const id = createSavedRecommendationId({
    type: "movie",
    title: "İçimdeki Işık",
    subtitle: "Kısa Öykü",
    sourceHistoryId: "abc",
  });

  assert.equal(id, "movie:abc:icimdeki-isik:kisa-oyku");
});

test("clearSavedRecommendations listeyi temizler", () => {
  saveRecommendation({ type: "advice", title: "Kısa nefes egzersizi" });
  assert.equal(getSavedRecommendations().length, 1);
  assert.deepEqual(clearSavedRecommendations(), []);
  assert.deepEqual(getSavedRecommendations(), []);
});
