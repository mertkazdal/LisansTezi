import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getEmotionMeta, getEmotionOptions } from "../lib/emotions";
import { historyAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error(t("history.loginRequired"));
      navigate("/login", { state: { from: "/history" } });
    }
  }, [isLoggedIn, navigate, t]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!isLoggedIn) {
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await historyAPI.getHistory(page, 10, filterEmotion);
        if (!cancelled) {
          setItems(data.items);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err.message || t("history.loadError");
          setError(message);
          setItems([]);
          setTotalPages(0);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [filterEmotion, isLoggedIn, page, t]);

  useEffect(() => {
    setSelectedItem(null);
  }, [filterEmotion, page]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    if (!items.some((item) => item.id === selectedItem.id)) {
      setSelectedItem(null);
    }
  }, [items, selectedItem]);

  const summary = useMemo(() => buildHistorySummary(items, i18n.language), [items, i18n.language]);

  function handleFilterChange(nextEmotion) {
    setSelectedItem(null);
    setFilterEmotion(nextEmotion);
    setPage(1);
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="page-shell aurora-bg app-page-tone history-page">
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <HistoryHero onAnalyze={() => navigate("/analyze")} t={t} />

        <section className="premium-card p-4 sm:p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-end">
            <div className="grid gap-3 sm:grid-cols-3">
              <HistorySummaryPill label={t("history.pageSummary")} value={String(summary.count)} />
              <HistorySummaryPill label={t("history.topEmotion")} value={summary.topEmotion.label} accentColor={summary.topEmotion.accentColor} />
              <HistorySummaryPill label={t("history.combinedAnalyses")} value={String(summary.multimodalCount)} />
            </div>
            <select
              value={filterEmotion}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="input-field w-full"
              aria-label={t("history.filterAria")}
            >
              <option value="all">{t("history.allEmotions")}</option>
              {getEmotionOptions().slice(0, 12).map((emotion) => (
                <option key={emotion.key} value={emotion.key}>
                  {getEmotionMeta(emotion.key, i18n.language).label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && <ErrorPanel message={error} t={t} />}

        {loading ? (
          <HistorySkeleton />
        ) : items.length === 0 ? (
          <HistoryEmptyState
            isFiltered={filterEmotion !== "all"}
            onReset={() => handleFilterChange("all")}
            onAnalyze={() => navigate("/analyze")}
            t={t}
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, index) => (
                <HistoryTimelineItem key={item.id} item={item} index={index} onSelect={() => setSelectedItem(item)} t={t} language={i18n.language} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} setPage={setPage} t={t} />
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <HistoryDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAnalyze={() => {
              setSelectedItem(null);
              navigate("/analyze");
            }}
            t={t}
            language={i18n.language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryHero({ onAnalyze, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="surface-panel-strong relative overflow-hidden p-5 sm:p-8"
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="section-eyebrow">{t("history.heroEyebrow")}</p>
          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl">
            {t("history.heroTitle")}
            <span className="gradient-text block">{t("history.heroTitleSuffix")}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            {t("history.heroDescription")}
          </p>
        </div>
        <div className="flex items-start lg:justify-end">
          <button type="button" onClick={onAnalyze} className="btn-primary w-full sm:w-auto">
            {t("history.newAnalysis")}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function HistorySummaryPill({ label, value, accentColor = "#38bdf8" }) {
  return (
    <div className="min-h-[5rem] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-black text-white" style={{ color: accentColor === "#38bdf8" ? undefined : accentColor }}>
        {value}
      </p>
    </div>
  );
}

function HistoryTimelineItem({ item, index, onSelect, t, language }) {
  const emotion = getEmotionMeta(item.emotion, language);
  const confidenceLabel = `${formatConfidence(item.confidence)} ${t("history.confidenceSuffix")}`;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.035 }}
      onClick={onSelect}
      className="premium-card premium-card-hover relative w-full p-0 text-left"
    >
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_9rem_9rem_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black"
            style={{ backgroundColor: `${emotion.accentColor}20`, color: emotion.accentColor }}
          >
            {emotion.label.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-black text-white">{emotion.label}</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${emotion.accentColor}18`, color: emotion.accentColor }}>
                {getModalityLabel(item.modalityUsed, t)}
              </span>
              {item.faceDetected && <span className="rounded-full bg-cyan-200/10 px-2 py-0.5 text-xs font-bold text-cyan-100">{t("history.faceSignalBadge")}</span>}
            </div>
            <p className="line-clamp-1 text-sm text-slate-300">{item.userText || t("history.missingText")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 lg:text-center">
          <p className="text-xs font-bold text-slate-500">{t("history.confidenceScore")}</p>
          <p className="mt-1 text-sm font-black text-slate-200">{confidenceLabel}</p>
        </div>

        <div className="text-sm font-bold text-slate-400 lg:text-right">
          {formatDateTime(item.createdAt, language)}
        </div>

        <span className="justify-self-start rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm font-black text-slate-300 lg:justify-self-end">
          {t("history.detail")}
        </span>
      </div>
    </motion.button>
  );
}

function HistoryDetailModal({ item, onClose, onAnalyze, t, language }) {
  const emotion = getEmotionMeta(item.emotion, language);
  const modalTitleId = `history-detail-title-${item.id || "analysis"}`;

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 18, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 18, opacity: 0, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
        className="premium-card max-h-[calc(100svh-2rem)] w-full max-w-3xl overflow-y-auto p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 p-4 sm:p-5" style={{ background: `linear-gradient(135deg, ${emotion.softAccent || `${emotion.accentColor}22`}, rgba(255,255,255,0.04))` }}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-2xl font-black"
                style={{ backgroundColor: `${emotion.accentColor}22`, color: emotion.accentColor }}
              >
                {emotion.label.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{t("history.miniResultPanel")}</p>
                <h2 id={modalTitleId} className="mt-1 break-words text-3xl font-black text-white">
                  {emotion.label}
                </h2>
                <p className="text-sm text-slate-400">{formatDateTime(item.createdAt, language)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost justify-self-start !px-3 !py-2 sm:justify-self-end" aria-label={t("history.closeDetailAria")}>
              {t("history.close")}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-200">
              {getModalityLabel(item.modalityUsed, t)}
            </span>
            {item.faceDetected && (
              <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100">
                {t("history.faceSignalBadge")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <InfoBlock label={t("history.userText")} value={item.userText || t("history.noText")} />
          {item.explanation && <InfoBlock label={t("history.systemExplanation")} value={item.explanation} />}

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label={t("history.model")} value={item.modelUsed || "gemini-multimodal"} />
            <InfoCard label={t("history.analysisType")} value={getModalityLabel(item.modalityUsed, t)} />
            <InfoCard label={t("history.responseTime")} value={item.responseTimeMs ? `${item.responseTimeMs} ms` : t("history.notAvailable")} />
            <InfoCard label={t("history.faceDetection")} value={item.faceDetected ? t("history.available") : t("history.unclear")} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onAnalyze} className="btn-primary">
              {t("history.newAnalysis")}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              {t("history.close")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left sm:text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((value) => (
        <div key={value} className="premium-card p-4">
          <div className="flex items-center gap-4">
            <div className="skeleton-card h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="skeleton-card h-3 w-2/5" />
              <div className="skeleton-card h-3 w-4/5" />
              <div className="skeleton-card h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryEmptyState({ isFiltered, onReset, onAnalyze, t }) {
  return (
    <div className="premium-card p-8 text-center">
      <div className="empty-illustration mx-auto max-w-2xl p-6">
        <div>
          <span className="orb mx-auto h-16 w-16" aria-hidden="true">
            <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
          </span>
          <p className="mt-6 text-xl font-black text-white">
            {isFiltered ? t("history.filterEmptyTitle") : t("history.emptyTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isFiltered
              ? t("history.emptyDescription")
              : t("history.emptyDescription")}
          </p>
          <button type="button" onClick={isFiltered ? onReset : onAnalyze} className="btn-primary mt-5">
            {isFiltered ? t("history.resetFilter") : t("history.startFirstAnalysis")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({ message, t }) {
  return (
    <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4" role="alert">
      <p className="text-sm font-black text-red-50">{t ? t("history.errorTitle") : "Geçmiş yüklenemedi"}</p>
      <p className="mt-1 text-sm text-red-100/85">{message}</p>
    </div>
  );
}

function Pagination({ page, totalPages, setPage, t }) {
  return (
    <div className="flex justify-center gap-2">
      <button
        type="button"
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        disabled={page === 1}
        className="btn-secondary !px-4 !py-2 disabled:opacity-40"
      >
        {t("history.previous")}
      </button>
      <span className="self-center rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-300">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        disabled={page === totalPages}
        className="btn-secondary !px-4 !py-2 disabled:opacity-40"
      >
        {t("history.next")}
      </button>
    </div>
  );
}

function buildHistorySummary(items, language = "tr") {
  const count = items.length;
  const emotionCounts = new Map();
  let faceDetectedCount = 0;
  let multimodalCount = 0;

  items.forEach((item) => {
    emotionCounts.set(item.emotion, (emotionCounts.get(item.emotion) || 0) + 1);
    if (item.faceDetected) {
      faceDetectedCount += 1;
    }
    if (item.modalityUsed === "multimodal") {
      multimodalCount += 1;
    }
  });

  const [topEmotionKey] = [...emotionCounts.entries()].sort((left, right) => right[1] - left[1])[0] || ["unknown", 0];
  return {
    count,
    topEmotion: getEmotionMeta(topEmotionKey, language),
    multimodalCount,
    faceDetectedCount,
  };
}

function formatDateTime(value, language = "tr") {
  const isEnglish = String(language || "tr").startsWith("en");
  return value ? new Date(value).toLocaleString(isEnglish ? "en-US" : "tr-TR") : isEnglish ? "No date" : "Tarih yok";
}

function formatConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0%";
  }

  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return `${Math.round(Math.max(0, Math.min(100, percent)))}%`;
}

function getModalityLabel(value, t) {
  if (value === "multimodal") {
    return t ? t("history.typeMultimodal") : "Metin + selfie";
  }

  if (value === "image") {
    return t ? t("history.typeImage") : "Selfie";
  }

  if (value === "text") {
    return t ? t("history.typeText") : "Metin";
  }

  return value || (t ? t("history.typeMissing") : "Analiz");
}
