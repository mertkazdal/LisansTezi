export function shouldRegisterServiceWorker({ isProd, hasWindow, hasNavigator, hasServiceWorker }) {
  return Boolean(isProd && hasWindow && hasNavigator && hasServiceWorker);
}

export function registerServiceWorker() {
  const hasWindow = typeof window !== "undefined";
  const hasNavigator = typeof navigator !== "undefined";
  const hasServiceWorker = hasNavigator && "serviceWorker" in navigator;

  if (
    !shouldRegisterServiceWorker({
      isProd: Boolean(import.meta.env?.PROD),
      hasWindow,
      hasNavigator,
      hasServiceWorker,
    })
  ) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("Yaşam Koçu service worker kaydı başarısız:", error);
    });
  });
}
