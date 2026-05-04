import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { getEmotionMeta } from "../lib/emotions";
import { downloadResultSummaryCard } from "../lib/resultShareCard";
import {
  createSavedRecommendationId,
  getSavedRecommendations,
  SAVED_RECOMMENDATIONS_EVENT,
  toggleSavedRecommendation,
} from "../lib/savedRecommendations";
import { emotionAPI, feedbackAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const RECOMMENDATION_TABS = [
  { key: "music", marker: "M", label: "Müzik", description: "Ritmini duygu durumuna yaklaştıran parçalar" },
  { key: "movie", marker: "F", label: "Film", description: "Moduna eşlik edecek sinematik öneriler" },
  { key: "book", marker: "K", label: "Kitap", description: "Zihinsel tona uygun okuma seçkisi" },
  { key: "advice", marker: "T", label: "Tavsiye", description: "Bugün uygulanabilir kısa koçluk adımları" },
];

const DEFAULT_RECOMMENDATIONS = {
  music: [],
  movie: [],
  book: [],
  advice: [],
};

export default function ResultPage() {
  const { t, i18n } = useTranslation();
  const { historyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const initialResult =
    location.state?.analysisResult && String(location.state.analysisResult.historyId) === String(historyId)
      ? location.state.analysisResult
      : null;

  const [result, setResult] = useState(initialResult);
  const [activeTab, setActiveTab] = useState("music");
  const [isLoading, setIsLoading] = useState(!initialResult);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(initialResult?.feedback || null);
  const [feedbackForm, setFeedbackForm] = useState(() => buildFeedbackForm(initialResult?.feedback));
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState(() => getSavedRecommendations());
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadResult() {
      if (!historyId || initialResult) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const data = await emotionAPI.getRecommendations(historyId);
        if (!cancelled) {
          setResult(data);
          setFeedback(data.feedback || null);
          setFeedbackForm(buildFeedbackForm(data.feedback));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Sonuç yüklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadResult();
    return () => {
      cancelled = true;
    };
  }, [historyId, initialResult]);

  useEffect(() => {
    function syncSavedRecommendations() {
      setSavedRecommendations(getSavedRecommendations());
    }

    window.addEventListener(SAVED_RECOMMENDATIONS_EVENT, syncSavedRecommendations);
    window.addEventListener("storage", syncSavedRecommendations);
    return () => {
      window.removeEventListener(SAVED_RECOMMENDATIONS_EVENT, syncSavedRecommendations);
      window.removeEventListener("storage", syncSavedRecommendations);
    };
  }, []);

  if (isLoading) {
    return <ResultLoading t={t} />;
  }

  if (error || !result) {
    return <ResultError error={error} onRetry={() => navigate("/analyze")} t={t} />;
  }

  const emotion = getEmotionMeta(result.emotion, i18n.language);
  const recommendations = result.recommendations || DEFAULT_RECOMMENDATIONS;
  const recommendationBundleCount = countRecommendationItems(recommendations);
  const recommendationTabs = getRecommendationTabs(t);
  const activeRecommendationMeta = recommendationTabs.find((tab) => tab.key === activeTab) || recommendationTabs[0];
  const targetHistoryId = result.historyId || historyId;
  const savedRecommendationIds = new Set(savedRecommendations.map((item) => item.id));
  const savedCountForResult = savedRecommendations.filter((item) => String(item.sourceHistoryId || "") === String(targetHistoryId || "")).length;

  async function handleSubmitFeedback() {
    if (!targetHistoryId) {
      toast.error(t("result.toast.feedbackMissingId"));
      return;
    }

    if (!feedbackForm.overallRating || !feedbackForm.analysisAccuracyRating || !feedbackForm.recommendationQualityRating) {
      toast.error(t("result.toast.feedbackMissingRatings"));
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await feedbackAPI.submit(targetHistoryId, {
        overallRating: feedbackForm.overallRating,
        analysisAccuracyRating: feedbackForm.analysisAccuracyRating,
        recommendationQualityRating: feedbackForm.recommendationQualityRating,
        helpful: feedbackForm.helpful,
        wouldReuse: feedbackForm.wouldReuse,
        comment: feedbackForm.comment.trim(),
      });
      setFeedback(response.feedback);
      setFeedbackForm(buildFeedbackForm(response.feedback));
      toast.success(feedback ? t("result.toast.feedbackUpdated") : t("result.toast.feedbackSaved"));
    } catch (requestError) {
      toast.error(requestError.message || t("result.toast.feedbackFailed"));
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  function handleToggleSavedRecommendation(item) {
    const response = toggleSavedRecommendation(item);
    setSavedRecommendations(response.items);
    toast.success(response.saved ? t("result.toast.saved") : t("result.toast.removed"));
  }

  async function handleDownloadSummaryCard() {
    setIsDownloadingCard(true);
    try {
      await downloadResultSummaryCard(result, emotion, t("result.shareCard", { returnObjects: true }), i18n.language);
      toast.success(t("result.toast.summaryDownloaded"));
    } catch (requestError) {
      toast.error(requestError.message || t("result.toast.summaryFailed"));
    } finally {
      setIsDownloadingCard(false);
    }
  }

  return (
    <div
      className="page-shell overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 18% 8%, ${emotion.auraFrom}, transparent 34rem),
          radial-gradient(circle at 82% 4%, ${emotion.auraTo}, transparent 30rem),
          radial-gradient(circle at 50% 105%, ${emotion.softAccent}, transparent 34rem)
        `,
      }}
    >
      <div className="relative z-10 mx-auto max-w-7xl space-y-7">
        <ResultHero emotion={emotion} result={result} recommendationBundleCount={recommendationBundleCount} t={t} />

        <InsightPanel emotion={emotion} result={result} recommendationBundleCount={recommendationBundleCount} t={t} />

        <RecommendationExplorer
          activeTab={activeTab}
          activeMeta={activeRecommendationMeta}
          accentColor={emotion.accentColor}
          emotion={emotion}
          recommendations={recommendations}
          onChangeTab={setActiveTab}
          sourceHistoryId={targetHistoryId}
          savedIds={savedRecommendationIds}
          onToggleSaved={handleToggleSavedRecommendation}
          tabs={recommendationTabs}
          t={t}
        />

        <FeedbackPanel
          accentColor={emotion.accentColor}
          feedback={feedback}
          feedbackForm={feedbackForm}
          isSubmittingFeedback={isSubmittingFeedback}
          onChange={setFeedbackForm}
          onSubmit={handleSubmitFeedback}
          t={t}
        />

        <NextStepCtas
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          accentColor={emotion.accentColor}
          savedCount={savedCountForResult}
          isDownloadingCard={isDownloadingCard}
          onDownloadCard={handleDownloadSummaryCard}
          t={t}
        />
      </div>
    </div>
  );
}

function ResultHero({ emotion, result, recommendationBundleCount, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: emotion.auraFrom }}
        animate={{ x: [0, 18, -8, 0], y: [0, 10, 18, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-24 right-0 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: emotion.auraTo }}
        animate={{ x: [0, -16, 10, 0], y: [0, -12, 8, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-eyebrow">{t("result.aiComplete")}</span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-bold"
              style={{ borderColor: `${emotion.accentColor}55`, color: emotion.accentColor, backgroundColor: `${emotion.accentColor}12` }}
            >
              {t("result.detectedEmotion", { emotion: emotion.label })}
            </span>
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {emotion.label}
            <span className="gradient-text block text-3xl sm:text-4xl lg:text-5xl">{t("result.customResult")}</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{emotion.message}</p>
          <p className="mt-4 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-slate-300">
            {emotion.resultTone}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[auto_1fr] lg:grid-cols-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroInsightCard
              label={t("result.analysisType")}
              value={getResultAnalysisTypeLabel(result.modalityUsed, t)}
              accentColor={emotion.accentColor}
            />
            <HeroInsightCard
              label={t("result.faceDetection")}
              value={result.faceDetected ? t("result.faceDetected") : t("result.faceUnknown")}
              accentColor={emotion.accentColor}
            />
            <HeroInsightCard
              label={t("result.selectedForYou")}
              value={String(recommendationBundleCount)}
              accentColor={emotion.accentColor}
            />
            <HeroInsightCard
              label={t("result.responseTime")}
              value={result.responseTimeMs ? `${result.responseTimeMs} ms` : "—"}
              accentColor={emotion.accentColor}
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">{t("result.coachComment")}</p>
            <p className="mt-3 text-base font-semibold leading-7 text-white">{emotion.coachPrompt}</p>
            {result.responseTimeMs && (
              <p className="mt-4 text-xs text-slate-500">{t("result.responseTime")}: {result.responseTimeMs} ms</p>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeroInsightCard({ label, value, accentColor }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
      <div className="mt-4 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
    </div>
  );
}

function InsightPanel({ emotion, result, recommendationBundleCount, t }) {
  const metrics = [
    {
      label: t("result.analysisType"),
      value: getResultAnalysisTypeLabel(result.modalityUsed, t),
      detail: t("result.analysisType"),
    },
    {
      label: t("result.model"),
      value: result.modelUsed || "gemini-multimodal",
      detail: t("result.model"),
    },
    {
      label: t("result.faceDetection"),
      value: result.faceDetected ? t("result.faceDetected") : t("result.faceUnknown"),
      detail: t("result.faceDetection"),
    },
    {
      label: t("result.selectedForYou"),
      value: String(recommendationBundleCount),
      detail: t("result.recommendationsDescription"),
    },
  ];

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="premium-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100/70">{t("result.insightPanel")}</p>
            <h2 className="mt-3 text-2xl font-black text-white">{t("result.insightPanel")}</h2>
          </div>
          <span
            className="h-3 w-3 rounded-full shadow-lg"
            style={{ backgroundColor: emotion.accentColor, boxShadow: `0 0 24px ${emotion.accentColor}` }}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {metrics.map((item) => (
            <InsightMetric key={item.label} item={item} accentColor={emotion.accentColor} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-4"
      >
        {result.warning && (
          <NarrativeCard
            title={t("result.warningNote")}
            text={result.warning}
            accentColor="#f59e0b"
            tone="warning"
          />
        )}
        {result.explanation && (
          <NarrativeCard
            title={t("result.coachComment")}
            text={result.explanation}
            accentColor={emotion.accentColor}
          />
        )}
        {!result.explanation && !result.warning && (
          <NarrativeCard
            title={t("result.coachComment")}
            text={emotion.coachPrompt}
            accentColor={emotion.accentColor}
          />
        )}
      </motion.div>
    </section>
  );
}

function InsightMetric({ item, accentColor }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
      <p className="mt-2 text-lg font-black text-white">{item.value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
      <div className="mt-4 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
    </div>
  );
}

function NarrativeCard({ title, text, accentColor, tone = "default" }) {
  return (
    <div
      className={`premium-card p-6 ${tone === "warning" ? "border-amber-200/20" : ""}`}
      style={{ boxShadow: `0 22px 70px ${accentColor}18` }}
    >
      <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: accentColor }}>
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}

function RecommendationExplorer({
  activeTab,
  activeMeta,
  accentColor,
  emotion,
  recommendations,
  onChangeTab,
  sourceHistoryId,
  savedIds,
  onToggleSaved,
  tabs,
  t,
}) {
  const activeItems = recommendations[activeTab] || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="premium-card overflow-hidden p-6 sm:p-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-eyebrow">{t("result.selectedForYou")}</p>
          <h2 className="mt-4 text-3xl font-black text-white">{t("result.selectedForYou")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {t("result.recommendationsDescription")}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.05] p-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTab(tab.key)}
                aria-pressed={active}
                className={`focus-ring relative min-w-24 rounded-2xl px-4 py-3 text-left transition ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="recommendation-tab"
                    className="absolute inset-0 rounded-2xl border"
                    style={{ borderColor: `${accentColor}55`, backgroundColor: `${accentColor}14` }}
                  />
                )}
                <span className="relative z-10 block text-[10px] font-black uppercase tracking-[0.22em]">{tab.marker}</span>
                <span className="relative z-10 mt-1 block text-sm font-black">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/20 p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: accentColor }}>
              {activeMeta.label}
            </p>
            <p className="mt-1 text-sm text-slate-400">{activeMeta.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-400">
              {activeItems.length}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-500">
              {emotion.label}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === "music" && (
              <MusicRecommendations
                items={recommendations.music}
                accentColor={accentColor}
                emotion={emotion}
                sourceHistoryId={sourceHistoryId}
                savedIds={savedIds}
                onToggleSaved={onToggleSaved}
                t={t}
              />
            )}
            {activeTab === "movie" && (
              <MovieRecommendations
                items={recommendations.movie}
                accentColor={accentColor}
                emotion={emotion}
                sourceHistoryId={sourceHistoryId}
                savedIds={savedIds}
                onToggleSaved={onToggleSaved}
                t={t}
              />
            )}
            {activeTab === "book" && (
              <BookRecommendations
                items={recommendations.book}
                accentColor={accentColor}
                emotion={emotion}
                sourceHistoryId={sourceHistoryId}
                savedIds={savedIds}
                onToggleSaved={onToggleSaved}
                t={t}
              />
            )}
            {activeTab === "advice" && (
              <AdviceRecommendations
                items={recommendations.advice}
                accentColor={accentColor}
                emotion={emotion}
                sourceHistoryId={sourceHistoryId}
                savedIds={savedIds}
                onToggleSaved={onToggleSaved}
                t={t}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function MusicRecommendations({ items = [], accentColor, emotion, sourceHistoryId, savedIds, onToggleSaved, t }) {
  if (!items.length) {
    return <EmptyRecommendationState type={t ? t("recommendations.music") : "müzik önerisi"} accentColor={accentColor} t={t} />;
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2">
      {items.map((item, index) => {
        const savedItem = buildSavedRecommendation("music", item, emotion, sourceHistoryId, index);
        return (
          <RecommendationShell
            key={savedItem.id}
            href={item.externalUrl}
            accentColor={accentColor}
            savedItem={savedItem}
            saved={savedIds.has(savedItem.id)}
            onToggleSaved={onToggleSaved}
          >
            <MediaCover
              imageUrl={item.coverUrl}
              title={item.title}
              fallback="♪"
              accentColor={accentColor}
              className="h-20 w-20"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-white">{item.title}</p>
              <p className="truncate text-sm text-slate-400">{item.artist}</p>
              {item.reason && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.reason}</p>}
            </div>
          </RecommendationShell>
        );
      })}
    </div>
  );
}

function MovieRecommendations({ items = [], accentColor, emotion, sourceHistoryId, savedIds, onToggleSaved, t }) {
  if (!items.length) {
    return <EmptyRecommendationState type={t ? t("recommendations.movie") : "film önerisi"} accentColor={accentColor} t={t} />;
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2">
      {items.map((item, index) => {
        const savedItem = buildSavedRecommendation("movie", item, emotion, sourceHistoryId, index);
        return (
          <RecommendationShell
            key={savedItem.id}
            href={item.externalUrl}
            accentColor={accentColor}
            layout="vertical"
            savedItem={savedItem}
            saved={savedIds.has(savedItem.id)}
            onToggleSaved={onToggleSaved}
          >
            <MediaCover
              imageUrl={item.posterUrl}
              title={item.title}
              fallback="F"
              accentColor={accentColor}
              className="aspect-[2/3] w-full"
            />
            <div className="w-full">
              <p className="mt-4 line-clamp-1 text-base font-black text-white">{item.title}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                {item.year && <span>{item.year}</span>}
                {item.rating && <span style={{ color: accentColor }}>★ {item.rating}</span>}
              </div>
              {item.overview && <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">{item.overview}</p>}
            </div>
          </RecommendationShell>
        );
      })}
    </div>
  );
}

function BookRecommendations({ items = [], accentColor, emotion, sourceHistoryId, savedIds, onToggleSaved, t }) {
  if (!items.length) {
    return <EmptyRecommendationState type={t ? t("recommendations.book") : "kitap önerisi"} accentColor={accentColor} t={t} />;
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2">
      {items.map((item, index) => {
        const savedItem = buildSavedRecommendation("book", item, emotion, sourceHistoryId, index);
        return (
          <RecommendationShell
            key={savedItem.id}
            href={item.externalUrl}
            accentColor={accentColor}
            savedItem={savedItem}
            saved={savedIds.has(savedItem.id)}
            onToggleSaved={onToggleSaved}
          >
            <MediaCover
              imageUrl={item.coverUrl}
              title={item.title}
              fallback="K"
              accentColor={accentColor}
              className="h-24 w-16"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-base font-black text-white">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">{item.author}</p>
              {item.reason && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.reason}</p>}
            </div>
          </RecommendationShell>
        );
      })}
    </div>
  );
}

function AdviceRecommendations({ items = [], accentColor, emotion, sourceHistoryId, savedIds, onToggleSaved, t }) {
  if (!items.length) {
    return <EmptyRecommendationState type={t ? t("recommendations.advice") : "hayat tavsiyesi"} accentColor={accentColor} t={t} />;
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2">
      {items.map((item, index) => {
        const savedItem = buildSavedRecommendation("advice", item, emotion, sourceHistoryId, index);
        return (
          <RecommendationShell
            key={savedItem.id}
            accentColor={accentColor}
            savedItem={savedItem}
            saved={savedIds.has(savedItem.id)}
            onToggleSaved={onToggleSaved}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              {safeMarker(item.icon, "AI")}
            </span>
            <div>
              <p className="text-base font-black text-white">{item.title}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.description}</p>
            </div>
          </RecommendationShell>
        );
      })}
    </div>
  );
}

function RecommendationShell({ href, accentColor, layout = "horizontal", savedItem, saved, onToggleSaved, children }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={`group relative flex snap-start overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 transition ${
        layout === "vertical" ? "min-w-[17rem] flex-col sm:min-w-[19rem]" : "min-w-[20rem] items-center gap-4 sm:min-w-[26rem]"
      }`}
      style={{ boxShadow: `0 18px 55px ${accentColor}10` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-0 blur-2xl transition group-hover:opacity-100"
        style={{ backgroundColor: `${accentColor}38` }}
      />
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleSaved(savedItem);
        }}
        aria-pressed={saved}
        className="focus-ring absolute right-3 top-3 z-20 rounded-full border px-3 py-1.5 text-xs font-black backdrop-blur-xl transition"
        style={{
          borderColor: saved ? `${accentColor}88` : "rgba(255,255,255,0.16)",
          backgroundColor: saved ? `${accentColor}24` : "rgba(15,23,42,0.78)",
          color: saved ? "#ffffff" : "#cbd5e1",
          boxShadow: saved ? `0 0 28px ${accentColor}35` : "none",
        }}
      >
        {saved ? "Kaydedildi" : "Kaydet"}
      </button>
      {children}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`focus-ring relative z-10 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-white/[0.1] ${
            layout === "vertical" ? "mt-4 self-start" : "ml-auto self-end"
          }`}
        >
          Aç
        </a>
      )}
    </motion.article>
  );
}

function buildSavedRecommendation(type, item, emotion, sourceHistoryId, index) {
  const title = item.title || "Öneri";
  const subtitle = getRecommendationSubtitle(type, item);
  const reason = item.reason || item.overview || item.description || "";
  const imageUrl = item.coverUrl || item.posterUrl || null;
  const externalUrl = item.externalUrl || null;

  return {
    id: createSavedRecommendationId({ type, title, subtitle, sourceHistoryId: sourceHistoryId || index }),
    type,
    title,
    subtitle,
    reason,
    imageUrl,
    externalUrl,
    emotion: emotion?.key || emotion?.label || null,
    sourceHistoryId: sourceHistoryId || null,
  };
}

function getRecommendationSubtitle(type, item) {
  if (type === "music") {
    return item.artist || "Müzik önerisi";
  }

  if (type === "movie") {
    return [item.year, item.rating ? `★ ${item.rating}` : ""].filter(Boolean).join(" · ") || "Film önerisi";
  }

  if (type === "book") {
    return item.author || "Kitap önerisi";
  }

  return "Kısa tavsiye";
}

function MediaCover({ imageUrl, title, fallback, accentColor, className }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={`shrink-0 rounded-2xl object-cover shadow-xl shadow-slate-950/30 ${className}`}
      />
    );
  }

  return (
    <div
      className={`shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] ${className} flex items-center justify-center text-2xl font-black`}
      style={{ color: accentColor, boxShadow: `inset 0 0 36px ${accentColor}18` }}
    >
      {fallback}
    </div>
  );
}

function EmptyRecommendationState({ type, accentColor, t }) {
  return (
    <div className="empty-illustration min-h-[240px] px-6 text-center">
      <div>
        <div
          className="mx-auto mb-4 h-14 w-14 rounded-full border border-white/10"
          style={{ backgroundColor: `${accentColor}16`, boxShadow: `0 0 42px ${accentColor}20` }}
        />
        <p className="text-base font-black text-white">{t ? t("result.emptyRecommendation", { category: type }) : `Bu analiz için henüz ${type} bulunmuyor.`}</p>
        <p className="mt-2 text-sm text-slate-500">Veri geldiğinde bu alan otomatik olarak premium kartlarla dolacak.</p>
      </div>
    </div>
  );
}

function FeedbackPanel({ accentColor, feedback, feedbackForm, isSubmittingFeedback, onChange, onSubmit, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="premium-card p-6 sm:p-7"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow">{t("feedback.title")}</p>
          <h2 className="mt-4 text-3xl font-black text-white">{t("feedback.title")}</h2>
          <p className="mt-2 text-sm text-slate-400">{t("feedback.description")}</p>
        </div>
        {feedback?.createdAt && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs text-emerald-100">
            {t("feedback.saved")}
            <span className="mt-1 block text-emerald-100/70">{new Date(feedback.createdAt).toLocaleString("tr-TR")}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RatingSelector
          accentColor={accentColor}
          label={t("feedback.overall")}
          value={feedbackForm.overallRating}
          onChange={(value) => onChange((current) => ({ ...current, overallRating: value }))}
        />
        <RatingSelector
          accentColor={accentColor}
          label={t("feedback.accuracy")}
          value={feedbackForm.analysisAccuracyRating}
          onChange={(value) => onChange((current) => ({ ...current, analysisAccuracyRating: value }))}
        />
        <RatingSelector
          accentColor={accentColor}
          label={t("feedback.recommendationQuality")}
          value={feedbackForm.recommendationQualityRating}
          onChange={(value) => onChange((current) => ({ ...current, recommendationQualityRating: value }))}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ToggleCard
          accentColor={accentColor}
          label={t("feedback.helpful")}
          value={feedbackForm.helpful}
          onChange={(value) => onChange((current) => ({ ...current, helpful: value }))}
          positiveLabel={t("feedback.yesHelpful")}
          negativeLabel={t("feedback.notHelpful")}
        />
        <ToggleCard
          accentColor={accentColor}
          label={t("feedback.wouldReuse")}
          value={feedbackForm.wouldReuse}
          onChange={(value) => onChange((current) => ({ ...current, wouldReuse: value }))}
          positiveLabel={t("feedback.yesReuse")}
          negativeLabel={t("feedback.notReuse")}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="feedback-comment" className="mb-2 block text-sm font-bold text-slate-300">
          {t("feedback.commentLabel")}
        </label>
        <textarea
          id="feedback-comment"
          value={feedbackForm.comment}
          onChange={(event) => onChange((current) => ({ ...current, comment: event.target.value }))}
          maxLength={280}
          aria-describedby="feedback-comment-counter"
          placeholder={t("feedback.commentPlaceholder")}
          className="input-field h-28 resize-none"
        />
        <div id="feedback-comment-counter" className="mt-2 text-right text-xs text-slate-500">
          {feedbackForm.comment.length}/280
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={onSubmit} disabled={isSubmittingFeedback} aria-busy={isSubmittingFeedback} className="btn-primary">
          {isSubmittingFeedback ? t("actions.saving") : feedback ? t("actions.updateFeedback") : t("actions.submitFeedback")}
        </button>
        {feedback && <span className="text-sm text-emerald-200">{t("feedback.successBadge")}</span>}
      </div>
    </motion.section>
  );
}

function RatingSelector({ label, value, onChange, accentColor }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
      <p className="mb-3 text-sm font-bold text-white">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const selected = value === rating;
          return (
            <motion.button
              key={`${label}-${rating}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(rating)}
              aria-pressed={selected}
              aria-label={`${label}: ${rating} puan`}
              className="focus-ring h-11 rounded-2xl border text-sm font-black transition"
              style={{
                borderColor: selected ? accentColor : "rgba(255,255,255,0.12)",
                backgroundColor: selected ? accentColor : "rgba(255,255,255,0.05)",
                color: selected ? "#020617" : "#cbd5e1",
                boxShadow: selected ? `0 0 24px ${accentColor}35` : "none",
              }}
            >
              {rating}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleCard({ label, value, onChange, positiveLabel, negativeLabel, accentColor }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
      <p className="mb-3 text-sm font-bold text-white">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <ToggleButton active={value === true} accentColor={accentColor} onClick={() => onChange(true)}>
          {positiveLabel}
        </ToggleButton>
        <ToggleButton active={value === false} accentColor="#64748b" onClick={() => onChange(false)}>
          {negativeLabel}
        </ToggleButton>
      </div>
    </div>
  );
}

function ToggleButton({ active, accentColor, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={typeof children === "string" ? children : undefined}
      className="focus-ring rounded-2xl border px-3 py-3 text-sm font-bold transition"
      style={{
        borderColor: active ? accentColor : "rgba(255,255,255,0.12)",
        backgroundColor: active ? `${accentColor}22` : "rgba(255,255,255,0.045)",
        color: active ? "#ffffff" : "#94a3b8",
      }}
    >
      {children}
    </button>
  );
}

function NextStepCtas({ isLoggedIn, navigate, accentColor, savedCount, isDownloadingCard, onDownloadCard, t }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ActionCard
        title={t("result.newAnalysis")}
        description="Duygu durumunu tekrar ölç ve önerilerini güncelle."
        actionLabel={t("actions.startAnalysis")}
        accentColor={accentColor}
        onClick={() => navigate("/analyze")}
      />
      <ActionCard
        title={isLoggedIn ? t("result.goHistory") : t("result.loginToSave")}
        description={isLoggedIn ? "Önceki analizlerinle bugünkü sonucu karşılaştır." : "Analiz geçmişini korumak için giriş yap."}
        actionLabel={isLoggedIn ? t("result.goHistory") : t("actions.login")}
        accentColor={accentColor}
        onClick={() => {
          if (isLoggedIn) {
            navigate("/history");
          } else {
            navigate("/login", { state: { from: "/history" } });
          }
        }}
      />
      <ActionCard
        title={t("result.summaryCard")}
        description="Duygu sonucunu kişisel metnini paylaşmadan premium PNG kart olarak kaydet."
        actionLabel={isDownloadingCard ? t("actions.preparing") : t("actions.downloadPng")}
        accentColor={accentColor}
        onClick={onDownloadCard}
        disabled={isDownloadingCard}
      />
      <ActionCard
        title={t("result.savedRecommendations")}
        description={
          savedCount > 0
            ? `Bu analizden ${savedCount} öneri bu cihazda saklandı.`
            : "Beğendiğin önerileri kaydet; profil panelinde bu cihazdan tekrar görebilirsin."
        }
        actionLabel={isLoggedIn ? t("navigation.profile") : t("actions.login")}
        accentColor={accentColor}
        onClick={() => navigate("/profile")}
      />
    </section>
  );
}

function ActionCard({ title, description, actionLabel, onClick, accentColor, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled}
      className="premium-card premium-card-hover focus-ring p-5 text-left"
      style={{ boxShadow: `0 24px 70px ${accentColor}14` }}
    >
      <p className="text-xl font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <span className="mt-5 inline-flex rounded-2xl px-4 py-2 text-sm font-black" style={{ backgroundColor: `${accentColor}22`, color: "#fff" }}>
        {actionLabel}
      </span>
    </button>
  );
}

function ResultLoading({ t }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="premium-card w-full max-w-md p-8 text-center">
        <span className="orb mx-auto h-16 w-16" aria-hidden="true">
          <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
        </span>
        <h1 className="mt-6 text-2xl font-black text-white">{t("result.loadingTitle")}</h1>
        <p className="mt-2 text-sm text-slate-400">{t("result.loadingDescription")}</p>
        <div className="mt-7 space-y-3">
          <div className="skeleton-card h-4" />
          <div className="skeleton-card mx-auto h-4 w-3/4" />
          <div className="skeleton-card mx-auto h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

function ResultError({ error, onRetry, t }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="premium-card w-full max-w-lg p-8 text-center">
        <p className="section-eyebrow mx-auto w-fit">{t("states.error")}</p>
        <h1 className="mt-5 text-2xl font-black text-white">{t("result.errorTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{error || t("result.errorDescription")}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onRetry} className="btn-primary">
            {t("result.newAnalysis")}
          </button>
          <Link to="/" className="btn-secondary">
            {t("navigation.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function buildFeedbackForm(feedback) {
  return {
    overallRating: feedback?.overallRating || 0,
    analysisAccuracyRating: feedback?.analysisAccuracyRating || 0,
    recommendationQualityRating: feedback?.recommendationQualityRating || 0,
    helpful: Boolean(feedback?.helpful),
    wouldReuse: Boolean(feedback?.wouldReuse),
    comment: feedback?.comment || "",
  };
}

function safeMarker(value, fallback) {
  const text = String(value || "").trim();
  if (!text || text.includes("\uFFFD") || text.length > 4) {
    return fallback;
  }

  return text;
}

function countRecommendationItems(recommendations) {
  const source = recommendations || DEFAULT_RECOMMENDATIONS;
  return ["music", "movie", "book", "advice"].reduce((total, key) => total + (Array.isArray(source[key]) ? source[key].length : 0), 0);
}

function getResultAnalysisTypeLabel(modalityUsed, t) {
  if (modalityUsed === "multimodal") {
    return t("result.textSelfie");
  }

  if (modalityUsed === "image") {
    return String(t("metrics.typeImage") || "");
  }

  return t("result.textOnly");
}

function getRecommendationTabs(t) {
  return [
    { key: "music", marker: "M", label: t("result.recommendations.music.label"), description: t("result.recommendations.music.description") },
    { key: "movie", marker: "F", label: t("result.recommendations.movie.label"), description: t("result.recommendations.movie.description") },
    { key: "book", marker: "K", label: t("result.recommendations.book.label"), description: t("result.recommendations.book.description") },
    { key: "advice", marker: "T", label: t("result.recommendations.advice.label"), description: t("result.recommendations.advice.description") },
  ];
}
