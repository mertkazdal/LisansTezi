import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { getEmotionMeta } from "../../lib/emotions";

const CHART_COLORS = ["#38bdf8", "#2dd4bf", "#f59e0b", "#fb7185", "#818cf8", "#22c55e", "#f97316", "#a78bfa"];
const GRID_STROKE = "rgba(148, 163, 184, 0.16)";
const AXIS_STYLE = { fill: "#94a3b8", fontSize: 12, fontWeight: 700 };

export default function MetricsChartsSection({ dashboard, research, responseTimes, distribution }) {
  const { t, i18n } = useTranslation();
  const emotionDistribution = useMemo(() => {
    const entries = Object.entries(distribution?.emotion_counts || {});
    const total = entries.reduce((sum, [, count]) => sum + toNumber(count), 0);

    return entries
      .map(([emotion, count], index) => {
        const meta = getEmotionMeta(emotion, i18n.language);
        const value = toNumber(count);
        return {
          name: meta.label,
          rawEmotion: emotion,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: meta.accentColor || CHART_COLORS[index % CHART_COLORS.length],
        };
      })
      .sort((left, right) => right.value - left.value);
  }, [distribution, i18n.language]);

  const responseSamples = useMemo(() => {
    return (responseTimes?.samples || []).map((sample, index) => ({
      name: `#${index + 1}`,
      value: toNumber(sample.responseTimeMs),
      emotion: getEmotionMeta(sample.emotion, i18n.language).label,
      model: sample.modelUsed || t("history.modelFallback"),
    }));
  }, [responseTimes, i18n.language, t]);

  const dailyActivity = useMemo(() => {
    return (dashboard?.dailyActivity || []).map((item) => ({
      name: formatDate(item.date),
      value: toNumber(item.count),
    }));
  }, [dashboard, t]);

  const feedbackTimeline = useMemo(() => {
    return (research?.feedbackTimeline || []).map((item) => ({
      name: formatDate(item.date),
      count: toNumber(item.count),
      rating: toNumber(item.averageOverallRating),
    }));
  }, [research, t]);

  const modelDistribution = useMemo(() => {
    return (dashboard?.modelDistribution || []).map((item) => ({
      name: item.key || "Model",
      value: toNumber(item.count),
    }));
  }, [dashboard]);

  const modalityDistribution = useMemo(() => {
    return (dashboard?.modalityDistribution || []).map((item) => ({
      name: getModalityLabel(item.key, t),
      value: toNumber(item.count),
    }));
  }, [dashboard]);

  const ratingDistribution = useMemo(() => {
    return (research?.ratingDistribution || []).map((item) => ({
      name: `${item.key || 0} ${t("metrics.points")}`,
      value: toNumber(item.count),
    }));
  }, [research]);

  return (
    <section className="space-y-6">
      <div className="premium-card relative overflow-hidden p-6">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">{t("metrics.chartEyebrow")}</p>
            <h2 className="mt-4 text-3xl font-black text-white">{t("metrics.chartStoryTitle")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              {t("metrics.chartStoryDescription")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
            <span className="font-bold text-cyan-100">{t("metrics.lazyChart")}</span>
            <span className="ml-2 text-slate-500">{t("metrics.lazyChartDescription")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title={t("metrics.responseTrendTitle")}
          description={t("metrics.responseTrendDescription")}
        >
          {responseSamples.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseSamples} margin={{ top: 14, right: 16, left: -8, bottom: 4 }}>
                <defs>
                  <linearGradient id="responseLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} unit=" ms" width={72} />
                <Tooltip content={<CustomTooltip valueLabel={t("metrics.responseTime")} valueSuffix=" ms" extraKey="emotion" />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#responseLine)"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#67e8f9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMetricsCard text={t("metrics.responseTrendEmpty")} />
          )}
        </ChartCard>

        <ChartCard
          title={t("metrics.dailyActivityTitle")}
          description={t("metrics.dailyActivityDescription")}
        >
          {dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivity} margin={{ top: 14, right: 16, left: -8, bottom: 4 }}>
                <defs>
                  <linearGradient id="dailyBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.42} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip valueLabel={t("metrics.analysisCount")} />} />
                <Bar dataKey="value" fill="url(#dailyBars)" radius={[12, 12, 4, 4]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMetricsCard text={t("metrics.dailyActivityEmpty")} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title={t("metrics.feedbackFlowTitle")}
          description={t("metrics.feedbackFlowDescription")}
        >
          {feedbackTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={feedbackTimeline} margin={{ top: 14, right: 16, left: -8, bottom: 4 }}>
                <defs>
                  <linearGradient id="feedbackLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} domain={[0, 5]} />
                <Tooltip content={<CustomTooltip valueLabel={t("metrics.averageScore")} valueSuffix=" / 5" extraKey="count" extraLabel="Feedback" />} />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="url(#feedbackLine)"
                  strokeWidth={4}
                  dot={{ r: 3, strokeWidth: 0, fill: "#fb7185" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#fed7aa" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMetricsCard text={t("metrics.feedbackFlowEmpty")} />
          )}
        </ChartCard>

        <ChartCard
          title={t("metrics.ratingDistributionTitle")}
          description={t("metrics.ratingDistributionDescription")}
        >
          {ratingDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution} margin={{ top: 14, right: 16, left: -8, bottom: 4 }}>
                <defs>
                  <linearGradient id="ratingBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip valueLabel={t("metrics.answer")} />} />
                <Bar dataKey="value" fill="url(#ratingBars)" radius={[12, 12, 4, 4]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMetricsCard text={t("metrics.ratingDistributionEmpty")} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard
          title={t("metrics.emotionDistributionTitle")}
          description={t("metrics.emotionDistributionDescription")}
        >
          {emotionDistribution.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emotionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={112}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="rgba(15, 23, 42, 0.75)"
                    strokeWidth={3}
                  >
                    {emotionDistribution.map((item) => (
                      <Cell key={item.rawEmotion} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip valueLabel={t("metrics.analysis")} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {emotionDistribution.map((item) => (
                  <LegendRow key={item.rawEmotion} item={{ ...item, shareLabel: t("metrics.distributionShare") }} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyMetricsCard text={t("metrics.emotionDistributionEmpty")} />
          )}
        </ChartCard>

        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title={t("metrics.modelDistributionTitle")}
            description={t("metrics.modelDistributionDescription")}
          >
            {modelDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={modelDistribution} margin={{ top: 10, right: 14, left: -8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip valueLabel={t("metrics.analysis")} />} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[12, 12, 4, 4]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyMetricsCard text={t("metrics.modelDistributionEmpty")} compact />
            )}
          </ChartCard>

          <ChartCard
            title={t("metrics.modalityDistributionTitle")}
            description={t("metrics.modalityDistributionDescription")}
          >
            {modalityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={modalityDistribution} margin={{ top: 10, right: 14, left: -8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip valueLabel={t("metrics.analysis")} />} />
                  <Bar dataKey="value" fill="#fb7185" radius={[12, 12, 4, 4]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyMetricsCard text={t("metrics.modalityDistributionEmpty")} compact />
            )}
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <div className="premium-card premium-card-hover p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, valueLabel = "Değer", valueSuffix = "", extraKey, extraLabel }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload || {};
  const value = payload[0]?.value;
  const formattedValue = Number.isFinite(Number(value)) ? Number(value).toLocaleString("tr-TR") : value;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">
        {valueLabel}: {formattedValue}
        {valueSuffix}
      </p>
      {extraKey && point[extraKey] !== undefined && (
        <p className="mt-1 text-xs text-slate-400">
          {extraLabel || "Bağlam"}: {point[extraKey]}
        </p>
      )}
    </div>
  );
}

function EmptyMetricsCard({ text, compact = false }) {
  return (
    <div className={`empty-illustration text-center ${compact ? "min-h-[180px]" : "min-h-[260px]"} flex items-center justify-center px-5`}>
      <div>
        <span className="mx-auto block h-12 w-12 rounded-full border border-cyan-200/20 bg-cyan-200/10 shadow-[0_0_35px_rgba(34,211,238,0.16)]" />
        <p className="mt-4 text-sm leading-6 text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function LegendRow({ item }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: item.color, boxShadow: `0 0 18px ${item.color}80` }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{item.name}</p>
        <p className="text-xs text-slate-500">%{Math.round(item.percentage)} {item.shareLabel || "dağılım payı"}</p>
      </div>
      <span className="rounded-full bg-white/[0.08] px-3 py-1 text-sm font-black text-slate-200">{item.value}</span>
    </div>
  );
}

function getModalityLabel(value, t) {
  if (value === "multimodal") {
    return t("metrics.typeMultimodal");
  }

  if (value === "image") {
    return t("metrics.typeImage");
  }

  if (value === "text") {
    return t("metrics.typeText");
  }

  return value || t("metrics.analysis");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
