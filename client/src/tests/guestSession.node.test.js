import assert from "node:assert/strict";
import test from "node:test";
import {
  getDefaultGuestLimit,
  getGuestRemainingAnalyses,
  getGuestSessionId,
  resetGuestQuotaState,
  resetGuestSessionState,
  setGuestRemainingAnalyses,
} from "../lib/guestSession.js";

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
  };
}

test.beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock();
});

test.afterEach(() => {
  delete globalThis.localStorage;
});

test("varsayılan misafir analiz limiti 3'tür", () => {
  assert.equal(getDefaultGuestLimit(), 3);
  assert.equal(getGuestRemainingAnalyses(), 3);
});

test("misafir kalan analiz sayısı negatif olamaz", () => {
  setGuestRemainingAnalyses(-5);
  assert.equal(getGuestRemainingAnalyses(), 0);
});

test("misafir session id stabil saklanır ve resetlenebilir", () => {
  const sessionId = getGuestSessionId();
  assert.equal(typeof sessionId, "string");
  assert.equal(getGuestSessionId(), sessionId);
  resetGuestSessionState();
  assert.equal(getGuestRemainingAnalyses(), 3);
});

test("misafir kota reseti yalnızca kalan hak değerini temizler", () => {
  setGuestRemainingAnalyses(1);
  assert.equal(getGuestRemainingAnalyses(), 1);
  resetGuestQuotaState();
  assert.equal(getGuestRemainingAnalyses(), 3);
});
