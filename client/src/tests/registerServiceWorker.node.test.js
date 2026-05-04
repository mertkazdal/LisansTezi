import assert from "node:assert/strict";
import test from "node:test";
import { shouldRegisterServiceWorker } from "../lib/registerServiceWorker.js";

test("service worker yalnızca production browser ortamında register edilir", () => {
  assert.equal(
    shouldRegisterServiceWorker({
      isProd: true,
      hasWindow: true,
      hasNavigator: true,
      hasServiceWorker: true,
    }),
    true,
  );
});

test("development veya desteksiz ortamda service worker register edilmez", () => {
  const base = { isProd: true, hasWindow: true, hasNavigator: true, hasServiceWorker: true };

  assert.equal(shouldRegisterServiceWorker({ ...base, isProd: false }), false);
  assert.equal(shouldRegisterServiceWorker({ ...base, hasWindow: false }), false);
  assert.equal(shouldRegisterServiceWorker({ ...base, hasNavigator: false }), false);
  assert.equal(shouldRegisterServiceWorker({ ...base, hasServiceWorker: false }), false);
});
