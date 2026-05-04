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
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!isLoggedIn) {
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await historyAPI.getHistory(page, 10);
        if (!cancelled) {
          setItems(data.items);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err.message || t("history.loadError");
          setError(message);
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
  }, [isLoggedIn, page]);

  useEffect(() => {
    setSelectedItem(null);
  }, [filterEmotion]);

  const filteredItems = useMemo(() => {
    if (filterEmotion === "all") {
      return items;
    }

    return items.filter((item) => item.emotion === filterEmotion);
  }, [filterEmotion, items]);

  const summary = useMemo(() => buildHistorySummary(filteredItems, i18n.language), [filteredItems, i18n.language]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="page-shell aurora-bg">
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <HistoryHero summary={summary} onAnalyze={() => navigate("/analyze")} t={t} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label={t("history.pageSummary")} value={String(summary.count)} detail={t("history.summaryCountDetail")} accentColor="#38bdf8" />
          <SummaryCard label={t("history.topEmotion")} value={summary.topEmotion.label} detail={t("history.topEmotionDetail")} accentColor={summary.topEmotion.accentColor} />
          <SummaryCard label={t("history.combinedAnalyses")} value={String(summary.multimodalCount)} detail={t("history.combinedAnalysesDetail")} accentColor="#22c55e" />
          <SummaryCard label={t("history.faceSignal")} value={String(summary.faceDetectedCount)} detail={t("history.faceSignalDetail")} accentColor="#f59e0b" />
        </div>

        <section className="premium-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">{t("history.filterTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {t("history.filterDescription")}
              </p>
            </div>
            <select
              value={filterEmotion}
              onChange={(event) => setFilterEmotion(event.target.value)}
              className="input-field lg:max-w-xs"
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
        ) : filteredItems.length === 0 ? (
          <HistoryEmptyState
            isFiltered={filterEmotion !== "all"}
            onReset={() => setFilterEmotion("all")}
            onAnalyze={() => navigate("/analyze")}
            t={t}
          />
        ) : (
          <div className="relative space-y-3">
            <div className="absolute bottom-6 left-6 top-6 hidden w-px bg-gradient-to-b from-cyan-200/0 via-cyan-200/25 to-cyan-200/0 md:block" />
            <AnimatePresence>
              {filteredItems.map((item, index) => (
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

function HistoryHero({ summary, onAnalyze, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10"
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="section-eyebrow">{t("history.heroEyebrow")}</p>
          <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl">
            {t("history.heroTitle")}
            <span className="gradient-text block">{t("history.heroTitleSuffix")}</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            {t("history.heroDescription")}
          </p>
          <button type="button" onClick={onAnalyze} className="btn-primary mt-7">
            {t("history.newAnalysis")}
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">{t("history.heroPulse")}</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.topEmotion.label}</p>
            </div>
            <span
              className="h-14 w-14 rounded-full border border-white/15"
              style={{ backgroundColor: `${summary.topEmotion.accentColor}22`, boxShadow: `0 0 36px ${summary.topEmotion.accentColor}35` }}
            />
          </div>
          <div className="mt-6 space-y-3">
            {[summary.count, summary.multimodalCount, summary.faceDetectedCount].map((value, index) => (
              <div key={index} className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="block h-full rounded-full bg-gradient-to-r from-cyan-200 to-teal-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(12, Math.min(100, Number(value) || 0))}%` }}
                  transition={{ delay: index * 0.1, duration: 0.7 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function SummaryCard({ label, value, detail, accentColor }) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full w-3/4 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
    </div>
  );
}

function HistoryTimelineItem({ item, index, onSelect, t, language }) {
  const emotion = getEmotionMeta(item.emotion, language);
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.035 }}
      onClick={onSelect}
      className="premium-card premium-card-hover relative w-full p-4 text-left md:pl-14"
    >
      <span
        className="absolute left-5 top-7 hidden h-3 w-3 rounded-full md:block"
        style={{ backgroundColor: emotion.accentColor, boxShadow: `0 0 22px ${emotion.accentColor}85` }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
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
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>{formatDateTime(item.createdAt, language)}</span>
            {item.responseTimeMs && <span>{item.responseTimeMs} ms</span>}
            <span>{getModalityLabel(item.modalityUsed, t)}</span>
            <span>{item.modelUsed || t("history.modelFallback")}</span>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm font-black text-slate-300">
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-xl sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
        className="premium-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 p-5" style={{ background: `linear-gradient(135deg, ${emotion.softAccent || `${emotion.accentColor}22`}, rgba(255,255,255,0.04))` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-black"
                style={{ backgroundColor: `${emotion.accentColor}22`, color: emotion.accentColor }}
              >
                {emotion.label.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{t("history.miniResultPanel")}</p>
                <h2 id={modalTitleId} className="mt-1 text-3xl font-black text-white">
                  {emotion.label}
                </h2>
                <p className="text-sm text-slate-400">{formatDateTime(item.createdAt, language)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost !px-3 !py-2" aria-label={t("history.closeDetailAria")}>
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

          <div className="grid grid-cols-2 gap-3">
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
          <p className="rounded-2xl border border-cyan-200/10 bg-cyan-200/10 px-4 py-3 text-xs leading-5 text-cyan-100/80">
            {t("history.savedTip")}
          </p>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center">
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
