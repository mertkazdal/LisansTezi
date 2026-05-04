import { Suspense, lazy, startTransition, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getEmotionMeta } from "../lib/emotions";
import { metricsAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const MetricsChartsSection = lazy(() => import("../components/metrics/MetricsChartsSection"));

const KPI_ACCENTS = ["#38bdf8", "#2dd4bf", "#f59e0b", "#a78bfa", "#22c55e", "#fb7185"];

export default function MetricsPage() {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [research, setResearch] = useState(null);
  const [responseTimes, setResponseTimes] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAdmin = Boolean(user?.isAdmin);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMetrics() {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, researchData, responseData, distributionData] = await Promise.all([
          metricsAPI.getDashboard(),
          metricsAPI.getResearch(),
          metricsAPI.getResponseTimes(),
          metricsAPI.getEmotionDistribution(),
        ]);

        if (!cancelled) {
          startTransition(() => {
            setDashboard(dashboardData);
            setResearch(researchData);
            setResponseTimes(responseData);
            setDistribution(distributionData);
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          startTransition(() => {
            setDashboard(null);
            setResearch(null);
            setResponseTimes(null);
            setDistribution(null);
          });
          setError(requestError.message || t("metrics.errorTitle"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isLoggedIn, t]);

  if (!isLoggedIn) {
    return (
      <MetricsAccessState
        title={String(i18n.language || "tr").startsWith("en") ? "Metrics access requires sign-in" : "Metriklere erişmek için giriş yap"}
        description={String(i18n.language || "tr").startsWith("en")
          ? "System-wide research metrics are protected. Sign in with an admin account to continue."
          : "Sistem geneli araştırma metrikleri korumalıdır. Devam etmek için yönetici hesabıyla giriş yap."}
        primaryLabel={t("navigation.login")}
        primaryTo="/login"
        secondaryLabel={t("navigation.home")}
        secondaryTo="/"
      />
    );
  }

  if (!isAdmin) {
    return (
      <MetricsAccessState
        title={String(i18n.language || "tr").startsWith("en") ? "Admin access required" : "Yönetici erişimi gerekli"}
        description={String(i18n.language || "tr").startsWith("en")
          ? "These metrics summarize system-wide usage and are available only to admin accounts."
          : "Bu metrikler sistem geneli kullanım özetini içerir ve yalnızca yönetici hesaplarına açıktır."}
        primaryLabel={t("navigation.profile")}
        primaryTo="/profile"
        secondaryLabel={t("navigation.home")}
        secondaryTo="/"
      />
    );
  }

  const summary = dashboard?.summary || {};
  const researchSummary = research?.summary || {};

  if (loading) {
    return <MetricsLoading t={t} />;
  }

  if (error) {
    return <MetricsErrorState error={error} t={t} />;
  }

  const kpis = [
    {
      label: t("metrics.kpis.total.label"),
      value: formatCount(summary.totalAnalyses),
      description: t("metrics.kpis.total.description"),
      badge: t("metrics.kpis.total.badge"),
      progress: 78,
    },
    {
      label: t("metrics.kpis.registered.label"),
      value: formatCount(summary.registeredAnalyses),
      description: t("metrics.kpis.registered.description"),
      badge: t("metrics.kpis.registered.badge"),
      progress: getShare(summary.registeredAnalyses, summary.totalAnalyses),
    },
    {
      label: t("metrics.kpis.guest.label"),
      value: formatCount(summary.guestAnalyses),
      description: t("metrics.kpis.guest.description"),
      badge: t("metrics.kpis.guest.badge"),
      progress: getShare(summary.guestAnalyses, summary.totalAnalyses),
    },
    {
      label: t("metrics.kpis.response.label"),
      value: `${Math.round(toNumber(summary.averageResponseTimeMs))} ms`,
      description: t("metrics.kpis.response.description"),
      badge: t("metrics.kpis.response.badge"),
      progress: responseSpeedScore(summary.averageResponseTimeMs),
    },
    {
      label: t("metrics.kpis.confidence.label"),
      value: formatPercent(toNumber(summary.averageConfidence) * 100),
      description: t("metrics.kpis.confidence.description"),
      badge: t("metrics.kpis.confidence.badge"),
      progress: toNumber(summary.averageConfidence) * 100,
    },
    {
      label: t("metrics.kpis.coverage.label"),
      value: formatPercent(summary.recommendationCoverageRate),
      description: t("metrics.kpis.coverage.description"),
      badge: t("metrics.kpis.coverage.badge"),
      progress: summary.recommendationCoverageRate,
    },
  ];

  const qualityCards = [
    {
      label: t("metrics.quality.feedbackCount.label"),
      value: formatCount(researchSummary.totalResponses),
      detail: t("metrics.quality.feedbackCount.detail"),
      mode: "count",
    },
    {
      label: t("metrics.quality.overall.label"),
      value: formatResearchScore(researchSummary.averageOverallRating),
      raw: researchSummary.averageOverallRating,
      detail: t("metrics.quality.overall.detail"),
      mode: "rating",
    },
    {
      label: t("metrics.quality.accuracy.label"),
      value: formatResearchScore(researchSummary.averageAnalysisAccuracyRating),
      raw: researchSummary.averageAnalysisAccuracyRating,
      detail: t("metrics.quality.accuracy.detail"),
      mode: "rating",
    },
    {
      label: t("metrics.quality.recommendation.label"),
      value: formatResearchScore(researchSummary.averageRecommendationQualityRating),
      raw: researchSummary.averageRecommendationQualityRating,
      detail: t("metrics.quality.recommendation.detail"),
      mode: "rating",
    },
    {
      label: t("metrics.quality.reuse.label"),
      value: formatPercent(researchSummary.wouldReuseRate),
      raw: researchSummary.wouldReuseRate,
      detail: t("metrics.quality.reuse.detail"),
      mode: "percent",
    },
  ];

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardHero
          t={t}
          totalAnalyses={summary.totalAnalyses}
          totalFeedback={researchSummary.totalResponses}
          averageConfidence={summary.averageConfidence}
        />

        <DashboardNotice totalAnalyses={summary.totalAnalyses} t={t} />

        <section className="space-y-4">
          <SectionHeader
            eyebrow={t("metrics.kpiSectionEyebrow")}
            title={t("metrics.kpiSectionTitle")}
            description={t("metrics.kpiSectionDescription")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((item, index) => (
              <KpiCard key={item.label} item={item} accentColor={KPI_ACCENTS[index % KPI_ACCENTS.length]} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow={t("metrics.researchSectionEyebrow")}
            title={t("metrics.researchSectionTitle")}
            description={t("metrics.researchSectionDescription")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {qualityCards.map((item, index) => (
              <QualityCard key={item.label} item={item} accentColor={KPI_ACCENTS[(index + 1) % KPI_ACCENTS.length]} t={t} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow={t("metrics.segmentSectionEyebrow")}
            title={t("metrics.segmentSectionTitle")}
            description={t("metrics.segmentSectionDescription")}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SegmentPanel
              title={t("metrics.segments.audienceTitle")}
              description={t("metrics.segments.audienceDescription")}
              items={research?.feedbackByAudience}
              labelForKey={(key) => getAudienceLabel(key, t)}
              t={t}
            />
            <SegmentPanel
              title={t("metrics.segments.faceTitle")}
              description={t("metrics.segments.faceDescription")}
              items={research?.feedbackByFaceDetection}
              labelForKey={(key) => getFaceDetectionLabel(key, t)}
              t={t}
            />
            <SegmentPanel
              title={t("metrics.segments.speedTitle")}
              description={t("metrics.segments.speedDescription")}
              items={research?.feedbackByResponseSpeed}
              labelForKey={(key) => getResponseSpeedLabel(key, t)}
              t={t}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel
            title={t("metrics.emotionSatisfactionTitle")}
            description={t("metrics.emotionSatisfactionDescription")}
          >
            {research?.feedbackByEmotion?.length ? (
              <div className="space-y-3">
                {research.feedbackByEmotion.map((item) => {
                  const emotion = getEmotionMeta(item.key, i18n.language);
                  return (
                    <MetricRow
                      key={item.key}
                      label={emotion.label}
                      value={`${Number(item.average || 0).toFixed(2)} / 5`}
                      meta={t("metrics.responses", { count: item.count || 0 })}
                      accentColor={emotion.accentColor}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState text={t("metrics.noEmotionSatisfaction")} />
            )}
          </Panel>

          <Panel
            title={t("metrics.qualityIndicatorsTitle")}
            description={t("metrics.qualityIndicatorsDescription")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricRow label={t("metrics.indicatorRows.faceDetectedRate")} value={formatPercent(summary.faceDetectedRate)} accentColor="#38bdf8" />
              <MetricRow label={t("metrics.indicatorRows.registeredUsers")} value={formatCount(summary.registeredUsers)} accentColor="#2dd4bf" />
              <MetricRow label={t("metrics.indicatorRows.guestSessions")} value={formatCount(summary.guestSessions)} accentColor="#f59e0b" />
              <MetricRow label={t("metrics.indicatorRows.responseSamples")} value={formatCount(responseTimes?.samples?.length)} accentColor="#a78bfa" />
              <MetricRow label={t("metrics.indicatorRows.helpfulRate")} value={formatPercent(researchSummary.helpfulRate)} accentColor="#22c55e" />
              <MetricRow label={t("metrics.indicatorRows.feedbackSample")} value={formatCount(researchSummary.totalResponses)} accentColor="#fb7185" />
            </div>
          </Panel>
        </section>

        <Panel
          title={t("metrics.researchCommentaryTitle")}
          description={t("metrics.researchCommentaryDescription")}
        >
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
            {t("metrics.totalFeedbackPrefix")} <span className="font-bold text-white">{formatCount(researchSummary.totalResponses)}</span>
            <span className="ml-2 text-slate-500">{t("metrics.totalFeedbackHint")}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResearchInsightCard
              title={t("metrics.insightStrongSide")}
              value={buildTopSegmentMessage(research?.feedbackByAudience, (key) => getAudienceLabel(key, t), t)}
              accentColor="#38bdf8"
              t={t}
            />
            <ResearchInsightCard
              title={t("metrics.insightFaceImpact")}
              value={buildTopSegmentMessage(research?.feedbackByFaceDetection, (key) => getFaceDetectionLabel(key, t), t)}
              accentColor="#2dd4bf"
              t={t}
            />
            <ResearchInsightCard
              title={t("metrics.insightSpeedComment")}
              value={buildTopSegmentMessage(research?.feedbackByResponseSpeed, (key) => getResponseSpeedLabel(key, t), t)}
              accentColor="#f59e0b"
              t={t}
            />
          </div>
        </Panel>

        <RecentAnalyses items={dashboard?.recentAnalyses} t={t} language={i18n.language} />

        <Suspense fallback={<ChartsFallback t={t} />}>
          <MetricsChartsSection
            dashboard={dashboard}
            research={research}
            responseTimes={responseTimes}
            distribution={distribution}
          />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardHero({ t, totalAnalyses, totalFeedback, averageConfidence }) {
  const bars = [44, 68, 52, 86, 64, 74, 58];
  return (
    <motion.section
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10"
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-indigo-400/12 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="section-eyebrow">{t("metrics.heroEyebrow")}</p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {t("brand.productName")}
            <span className="gradient-text block">{t("metrics.heroTitle")}</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            {t("metrics.heroDescription")}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-100/70">{t("metrics.heroPulse")}</p>
              <p className="mt-2 text-2xl font-black text-white">{t("metrics.heroLiveSummary")}</p>
            </div>
            <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
              {t("metrics.heroActiveMonitoring")}
            </span>
          </div>

          <div className="mt-6 flex h-28 items-end gap-2">
            {bars.map((height, index) => (
              <motion.span
                key={index}
                className="flex-1 rounded-t-2xl bg-gradient-to-t from-cyan-400/30 to-teal-200"
                style={{ height: `${height}%` }}
                animate={{ height: [`${height}%`, `${Math.min(98, height + 12)}%`, `${height}%`] }}
                transition={{ duration: 2.8 + index * 0.15, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <MiniHeroStat label={t("metrics.heroMiniAnalyses")} value={formatCount(totalAnalyses)} />
            <MiniHeroStat label={t("metrics.heroMiniFeedback")} value={formatCount(totalFeedback)} />
            <MiniHeroStat label={t("metrics.heroMiniConfidence")} value={formatPercent(toNumber(averageConfidence) * 100)} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function MiniHeroStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function DashboardNotice({ totalAnalyses, t }) {
  const hasData = toNumber(totalAnalyses) > 0;
  return (
    <div className="premium-card border-cyan-200/20 p-5 text-sm leading-6 text-slate-300">
      {hasData
        ? t("metrics.noticeWithData")
        : t("metrics.noticeEmpty")}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-black text-white">{title}</h2>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function KpiCard({ item, accentColor }) {
  const progress = clampPercent(item.progress);
  return (
    <motion.div whileHover={{ y: -4 }} className="premium-card premium-card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-400">{item.label}</p>
          <p className="mt-2 text-4xl font-black text-white">{item.value}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-[11px] font-bold" style={{ borderColor: `${accentColor}55`, color: accentColor }}>
          {item.badge}
        </span>
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">{item.description}</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className="block h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

function QualityCard({ item, accentColor, t }) {
  const progress = item.mode === "rating" ? (toNumber(item.raw) / 5) * 100 : item.mode === "percent" ? item.raw : 35;
  return (
    <div className="premium-card p-5">
      <p className="text-sm font-bold text-slate-400">{item.label}</p>
      <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
      <p className="mt-3 min-h-14 text-xs leading-5 text-slate-500">{item.detail}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full"
          style={{ width: `${clampPercent(progress)}%`, backgroundColor: accentColor }}
        />
      </div>
      {item.mode === "count" && <p className="mt-3 text-xs text-slate-500">{item.accumulatingLabel || t("metrics.accumulating")}</p>}
    </div>
  );
}

function Panel({ title, description, children }) {
  return (
    <section className="premium-card p-6">
      <h2 className="text-xl font-black text-white">{title}</h2>
      {description && <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>}
      <div className={description ? "mt-5" : "mt-4"}>{children}</div>
    </section>
  );
}

function SegmentPanel({ title, description, items, labelForKey, t }) {
  const topKey = getTopSegment(items)?.key;
  return (
    <Panel title={title} description={description}>
      {items?.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const isTop = item.key === topKey;
            return (
              <div
                key={item.key}
                className={`rounded-2xl border p-4 ${isTop ? "border-cyan-200/35 bg-cyan-200/10" : "border-white/10 bg-white/[0.06]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">{labelForKey(item.key)}</p>
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-xs text-slate-400">
                    {isTop ? t("metrics.topSegment") : t("metrics.responses", { count: item.count || 0 })}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <SegmentStat label={t("metrics.overall")} value={`${Number(item.averageOverallRating || 0).toFixed(2)} / 5`} />
                  <SegmentStat label={t("metrics.accuracy")} value={`${Number(item.averageAnalysisAccuracyRating || 0).toFixed(2)} / 5`} />
                  <SegmentStat label={t("metrics.recommendation")} value={`${Number(item.averageRecommendationQualityRating || 0).toFixed(2)} / 5`} />
                  <SegmentStat label={t("metrics.reuse")} value={formatPercent(item.wouldReuseRate)} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState text={t("metrics.noSegmentData")} />
      )}
    </Panel>
  );
}

function SegmentStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function MetricRow({ label, value, meta, accentColor = "#38bdf8" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-slate-300">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-right">
        <span className="block font-bold text-white">{value}</span>
        {meta && <span className="text-xs text-slate-500">{meta}</span>}
      </span>
    </div>
  );
}

function ResearchInsightCard({ title, value, accentColor, t }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4">
      <span className="rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
        {t("metrics.finding")}
      </span>
      <p className="mt-4 text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}

function RecentAnalyses({ items, t, language }) {
  return (
    <Panel
      title={t("metrics.recentAnalysesTitle")}
      description={t("metrics.recentAnalysesDescription")}
    >
      {items?.length ? (
        <div className="space-y-3">
          {items.map((item, index) => {
            const emotion = getEmotionMeta(item.emotion, language);
            return (
              <motion.div
                key={item.id || `${item.emotion}-${index}`}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: emotion.accentColor, boxShadow: `0 0 18px ${emotion.accentColor}80` }}
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{emotion.label}</p>
                      <p className="text-xs text-slate-400">
                        {formatPercent(toNumber(item.confidence) * 100)} {t("metrics.confidenceSuffix")} | {getAnalysisTypeLabel(item.modalityUsed, t)} | {item.modelUsed || t("metrics.modelMissing")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:ml-auto sm:justify-end">
                    {item.faceDetected && <span className="rounded-full bg-cyan-200/10 px-2.5 py-1 text-xs text-cyan-100">{t("metrics.faceSignalAvailable")}</span>}
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString(String(language || "tr").startsWith("en") ? "en-US" : "tr-TR") : t("metrics.dateMissing")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState text={t("metrics.noRecentAnalyses")} />
      )}
    </Panel>
  );
}

function EmptyState({ text }) {
  return <div className="empty-illustration px-4 text-center text-sm">{text}</div>;
}

function MetricsLoading({ t }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="premium-card w-full max-w-md px-8 py-8 text-center text-slate-300">
        <span className="orb mx-auto h-14 w-14" aria-hidden="true">
          <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
        </span>
        <h1 className="mt-6 text-2xl font-black text-white">{t("metrics.loadingTitle")}</h1>
        <p className="mt-2 text-sm text-slate-400">{t("metrics.loadingDescription")}</p>
        <div className="mt-6 space-y-3">
          <div className="skeleton-card h-3" />
          <div className="skeleton-card mx-auto h-3 w-3/4" />
          <div className="skeleton-card mx-auto h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

function ChartsFallback({ t }) {
  return (
    <div className="premium-card px-6 py-10 text-center text-sm text-slate-400" role="status" aria-live="polite" aria-busy="true">
      {t("metrics.chartsFallback")}
    </div>
  );
}

function MetricsAccessState({ title, description, primaryLabel, primaryTo, secondaryLabel, secondaryTo }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="premium-card w-full max-w-2xl p-8 text-center">
        <p className="section-eyebrow mx-auto w-fit">Admin</p>
        <h1 className="mt-6 text-3xl font-black text-white">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={primaryTo} className="btn-primary">
            {primaryLabel}
          </Link>
          <Link to={secondaryTo} className="btn-secondary">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricsErrorState({ error, t }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="premium-card w-full max-w-2xl p-8 text-center">
        <p className="section-eyebrow mx-auto w-fit">{t("states.error")}</p>
        <h1 className="mt-6 text-3xl font-black text-white">{t("metrics.errorTitle")}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{error}</p>
        <div className="mt-7 flex justify-center">
          <Link to="/" className="btn-secondary">
            {t("navigation.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatResearchScore(value) {
  const numeric = toNumber(value);
  return numeric > 0 ? `${numeric.toFixed(2)} / 5` : "0 / 5";
}

function buildTopSegmentMessage(items, labelForKey, t) {
  if (!items?.length) {
    return t("metrics.notEnoughData");
  }

  const top = getTopSegment(items);
  return t("metrics.topSegmentMessage", { segment: labelForKey(top.key), score: Number(top.averageOverallRating || 0).toFixed(2) });
}

function getTopSegment(items) {
  if (!items?.length) {
    return null;
  }

  return [...items].sort((left, right) => {
    const ratingDelta = Number(right.averageOverallRating || 0) - Number(left.averageOverallRating || 0);
    if (ratingDelta !== 0) {
      return ratingDelta;
    }

    return Number(right.count || 0) - Number(left.count || 0);
  })[0];
}

function getAudienceLabel(key, t) {
  return key === "registered" ? t("metrics.audienceRegistered") : t("metrics.audienceGuest");
}

function getFaceDetectionLabel(key, t) {
  return key === "face_detected" ? t("metrics.faceDetected") : t("metrics.faceUnknown");
}

function getResponseSpeedLabel(key, t) {
  if (key === "fast") {
    return t("metrics.speedFast");
  }

  if (key === "steady") {
    return t("metrics.speedSteady");
  }

  return t("metrics.speedDeep");
}

function getAnalysisTypeLabel(value, t) {
  if (value === "multimodal") {
    return t("metrics.typeMultimodal");
  }

  if (value === "text") {
    return t("metrics.typeText");
  }

  if (value === "image") {
    return t("metrics.typeImage");
  }

  return t("metrics.typeMissing");
}

function responseSpeedScore(value) {
  const ms = toNumber(value);
  if (ms <= 0) {
    return 0;
  }

  return clampPercent(100 - ms / 120);
}

function getShare(value, total) {
  const denominator = toNumber(total);
  if (denominator <= 0) {
    return 0;
  }

  return (toNumber(value) / denominator) * 100;
}

function formatCount(value) {
  return String(Math.round(toNumber(value)));
}

function formatPercent(value) {
  return `%${Math.round(clampPercent(value))}`;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, toNumber(value)));
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
