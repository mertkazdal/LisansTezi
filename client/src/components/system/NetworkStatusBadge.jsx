import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function getInitialOnlineStatus() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

function NetworkStatusBadge() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [showOnlineReturn, setShowOnlineReturn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let returnTimer;

    const handleOffline = () => {
      window.clearTimeout(returnTimer);
      setShowOnlineReturn(false);
      setIsOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineReturn(true);
      returnTimer = window.setTimeout(() => setShowOnlineReturn(false), 2800);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(returnTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const shouldShow = !isOnline || showOnlineReturn;

  return (
    <AnimatePresence>
      {shouldShow ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed right-4 z-[70] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 bg-slate-950/88 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl bottom-[calc(env(safe-area-inset-bottom)+6rem)] md:bottom-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                isOnline ? "bg-emerald-300 shadow-lg shadow-emerald-300/40" : "bg-amber-300 shadow-lg shadow-amber-300/40"
              }`}
              aria-hidden="true"
            />
            <div>
              <p className="font-extrabold text-white">
                {isOnline ? t("pwa.onlineTitle") : t("pwa.offlineTitle")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                {isOnline ? t("pwa.onlineDescription") : t("pwa.offlineDescription")}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default NetworkStatusBadge;
