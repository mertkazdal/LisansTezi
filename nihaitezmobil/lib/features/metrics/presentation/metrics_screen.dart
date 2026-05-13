/// Web-canonical admin metrics dashboard with charts and raw-safe sections.
library;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/emotion_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/animated_loading.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_state.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../domain/metrics_models.dart';
import 'providers/metrics_provider.dart';

class MetricsScreen extends ConsumerStatefulWidget {
  const MetricsScreen({super.key});

  @override
  ConsumerState<MetricsScreen> createState() => _MetricsScreenState();
}

class _MetricsScreenState extends ConsumerState<MetricsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadIfAllowed());
  }

  void _loadIfAllowed() {
    final authState = ref.read(authProvider);
    if (authState.user?.isAdmin == true) {
      ref.read(metricsProvider.notifier).load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final state = ref.watch(metricsProvider);
    final isAdmin = authState.user?.isAdmin == true;

    if (isAdmin && state.status == MetricsStatus.idle) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadIfAllowed());
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(t('metrics')),
        actions: [
          IconButton(
            tooltip: t('refresh'),
            onPressed: isAdmin
                ? () => ref.read(metricsProvider.notifier).load()
                : null,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: authState.isLoading || authState.status.name == 'unknown'
              ? Center(child: AnimatedLoading(message: t('loading')))
              : !authState.isAuthenticated
              ? _MetricsAccessState(
                  icon: Icons.lock_outline_rounded,
                  title: t('metricsLoginTitle'),
                  body: t('metricsLoginRequired'),
                  primaryLabel: t('login'),
                  primaryIcon: Icons.login_rounded,
                  onPrimary: () => context.go(
                    '/login?from=${Uri.encodeComponent('/metrics')}',
                  ),
                  secondaryLabel: t('home'),
                  secondaryIcon: Icons.home_rounded,
                  onSecondary: () => context.go('/'),
                )
              : !isAdmin
              ? _MetricsAccessState(
                  icon: Icons.admin_panel_settings_outlined,
                  title: t('metricsUnauthorizedTitle'),
                  body: t('metricsUnauthorizedBody'),
                  primaryLabel: t('profileTitle'),
                  primaryIcon: Icons.person_rounded,
                  onPrimary: () => context.go('/profile'),
                  secondaryLabel: t('home'),
                  secondaryIcon: Icons.home_rounded,
                  onSecondary: () => context.go('/'),
                )
              : _MetricsBody(
                  state: state,
                  onRefresh: () => ref.read(metricsProvider.notifier).load(),
                  onRetry: () => ref.read(metricsProvider.notifier).load(),
                ),
        ),
      ),
    );
  }
}

class _MetricsBody extends StatelessWidget {
  const _MetricsBody({
    required this.state,
    required this.onRefresh,
    required this.onRetry,
  });

  final MetricsState state;
  final Future<void> Function() onRefresh;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && state.bundle == null) {
      return Center(child: AnimatedLoading(message: t('metricsLoading')));
    }

    if (state.status == MetricsStatus.failure && state.bundle == null) {
      return Center(
        child: ErrorState(
          title: t('metricsLoadErrorTitle'),
          body: state.errorMessage ?? t('metricsLoadErrorBody'),
          actionLabel: t('retry'),
          onAction: onRetry,
        ),
      );
    }

    if ((state.status == MetricsStatus.unauthorized ||
            state.status == MetricsStatus.forbidden) &&
        state.bundle == null) {
      return Center(
        child: EmptyState(
          icon: Icons.admin_panel_settings_outlined,
          title: t('metricsUnauthorizedTitle'),
          body: state.errorMessage ?? t('metricsUnauthorizedBody'),
          accentColor: AppColors.warning,
        ),
      );
    }

    final bundle = state.bundle;
    if (bundle == null) {
      return Center(child: AnimatedLoading(message: t('metricsLoading')));
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
        children: [
          _MetricsHero(bundle: bundle),
          if (state.isLoading) ...[
            const SizedBox(height: 12),
            AnimatedLoading(message: t('metricsRefreshing')),
          ],
          const SizedBox(height: 14),
          _DashboardNotice(hasData: bundle.hasUsableData),
          const SizedBox(height: 14),
          _KpiGrid(dashboard: bundle.dashboard),
          const SizedBox(height: 14),
          _QualityGrid(dashboard: bundle.dashboard, research: bundle.research),
          const SizedBox(height: 14),
          if (state.status == MetricsStatus.empty || !bundle.hasUsableData)
            EmptyState(
              icon: Icons.insights_rounded,
              title: t('metricsEmptyTitle'),
              body: t('metricsEmptyBody'),
              accentColor: AppColors.info,
            )
          else ...[
            _EmotionDistributionCard(points: bundle.emotionDistribution),
            const SizedBox(height: 14),
            _ResponseTimesCard(summary: bundle.responseTimes),
            const SizedBox(height: 14),
            _DistributionPanels(bundle: bundle),
            const SizedBox(height: 14),
            _RecentAnalysesCard(
              items: _asList(bundle.dashboard.raw['recentAnalyses']),
            ),
          ],
          const SizedBox(height: 14),
          _RawMetricsCard(
            title: t('metricsResearchTitle'),
            subtitle: t('metricsResearchRawSubtitle'),
            data: bundle.research,
          ),
          const SizedBox(height: 14),
          _RawMetricsCard(
            title: t('metricsComparisonTitle'),
            subtitle: t('metricsComparisonRawSubtitle'),
            data: bundle.comparison,
          ),
          const SizedBox(height: 14),
          _RawMetricsCard(
            title: t('metricsAdminOverviewTitle'),
            subtitle: t('metricsAdminOverviewRawSubtitle'),
            data: bundle.adminOverview,
          ),
          const SizedBox(height: 14),
          _CsvDisabledNote(),
        ],
      ),
    );
  }
}

class _MetricsHero extends StatelessWidget {
  const _MetricsHero({required this.bundle});

  final MetricsBundle bundle;

  @override
  Widget build(BuildContext context) {
    final dashboard = bundle.dashboard;
    return GlassmorphismCard(
      padding: const EdgeInsets.all(20),
      borderColor: AppColors.primaryLight.withValues(alpha: 0.24),
      child: Stack(
        children: [
          Positioned(
            right: -54,
            top: -62,
            child: _Glow(color: AppColors.primaryLight, size: 170),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _Eyebrow(text: t('metricsHeroEyebrow')),
              const SizedBox(height: 10),
              Text(
                t('metricsHeroTitle'),
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                t('metricsHeroDescription'),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _HeroMiniStat(
                      label: t('totalAnalyses'),
                      value: '${dashboard.totalAnalyses}',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _HeroMiniStat(
                      label: t('metricsFeedbackResponses'),
                      value: '${dashboard.totalFeedbackResponses}',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _HeroMiniStat(
                      label: t('metricsAverageConfidence'),
                      value: _formatPercent(dashboard.averageConfidence),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DashboardNotice extends StatelessWidget {
  const _DashboardNotice({required this.hasData});

  final bool hasData;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.info.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.info.withValues(alpha: 0.2)),
      ),
      child: Text(
        hasData ? t('metricsNoticeWithData') : t('metricsNoticeEmpty'),
        style: Theme.of(
          context,
        ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.dashboard});

  final MetricsDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final items = [
      _MetricTileData(
        t('totalAnalyses'),
        '${dashboard.totalAnalyses}',
        Icons.psychology_alt_outlined,
        AppColors.primaryLight,
      ),
      _MetricTileData(
        t('metricsTotalUsers'),
        '${dashboard.totalUsers}',
        Icons.people_outline_rounded,
        AppColors.secondaryLight,
      ),
      _MetricTileData(
        t('metricsRegisteredAnalyses'),
        '${dashboard.registeredAnalyses}',
        Icons.verified_user_outlined,
        AppColors.success,
      ),
      _MetricTileData(
        t('metricsGuestAnalyses'),
        '${dashboard.guestAnalyses}',
        Icons.person_outline_rounded,
        AppColors.info,
      ),
      _MetricTileData(
        t('metricsAverageConfidence'),
        _formatPercent(dashboard.averageConfidence),
        Icons.verified_rounded,
        AppColors.success,
      ),
      _MetricTileData(
        t('metricsAverageResponseTime'),
        '${dashboard.averageResponseTimeMs.round()} ${t('milliseconds')}',
        Icons.speed_rounded,
        AppColors.warning,
      ),
      _MetricTileData(
        t('metricsRecommendationCoverage'),
        _formatPercent(dashboard.recommendationCoverageRate),
        Icons.recommend_outlined,
        AppColors.accentLight,
      ),
      _MetricTileData(
        t('metricsFeedbackResponses'),
        '${dashboard.totalFeedbackResponses}',
        Icons.rate_review_outlined,
        AppColors.primary,
      ),
      _MetricTileData(
        t('metricsAverageRating'),
        _formatRating(dashboard.averageOverallRating),
        Icons.star_half_rounded,
        AppColors.secondaryLight,
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(
          title: t('metricsKpiSectionTitle'),
          subtitle: t('metricsKpiSectionBody'),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.22,
          ),
          itemBuilder: (context, index) => _MetricTile(data: items[index])
              .animate(delay: (35 * index).ms)
              .fadeIn(duration: 220.ms)
              .slideY(begin: 0.04, end: 0),
        ),
      ],
    );
  }
}

class _QualityGrid extends StatelessWidget {
  const _QualityGrid({required this.dashboard, required this.research});

  final MetricsDashboard dashboard;
  final Map<String, dynamic> research;

  @override
  Widget build(BuildContext context) {
    final summary = _asMap(research['summary']);
    final feedbackCount =
        _readInt(summary, ['totalResponses']) ??
        dashboard.totalFeedbackResponses;
    final averageOverall =
        _readDouble(summary, ['averageOverallRating']) ??
        dashboard.averageOverallRating;
    final averageAccuracy =
        _readDouble(summary, ['averageAnalysisAccuracyRating']) ??
        dashboard.averageAnalysisAccuracyRating;
    final recommendationQuality =
        _readDouble(summary, ['averageRecommendationQualityRating']) ??
        dashboard.averageRecommendationQualityRating;
    final wouldReuse =
        _readDouble(summary, ['wouldReuseRate']) ?? dashboard.wouldReuseRate;
    final helpful =
        _readDouble(summary, ['helpfulRate']) ?? dashboard.helpfulRate;

    final items = [
      _MetricTileData(
        t('metricsFeedbackResponses'),
        '$feedbackCount',
        Icons.feedback_outlined,
        AppColors.primaryLight,
      ),
      _MetricTileData(
        t('metricsAverageRating'),
        _formatRating(averageOverall),
        Icons.star_outline_rounded,
        AppColors.warning,
      ),
      _MetricTileData(
        t('metricsAccuracyRating'),
        _formatRating(averageAccuracy),
        Icons.center_focus_strong_outlined,
        AppColors.success,
      ),
      _MetricTileData(
        t('metricsRecommendationRating'),
        _formatRating(recommendationQuality),
        Icons.recommend_outlined,
        AppColors.accentLight,
      ),
      _MetricTileData(
        t('metricsHelpfulRate'),
        _formatPercent(helpful),
        Icons.thumb_up_alt_outlined,
        AppColors.info,
      ),
      _MetricTileData(
        t('metricsWouldReuseRate'),
        _formatPercent(wouldReuse),
        Icons.replay_rounded,
        AppColors.secondaryLight,
      ),
    ];

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: t('metricsQualitySectionTitle'),
            subtitle: t('metricsQualitySectionBody'),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.5,
            ),
            itemBuilder: (context, index) => _MetricTile(data: items[index]),
          ),
        ],
      ),
    );
  }
}

class _EmotionDistributionCard extends StatelessWidget {
  const _EmotionDistributionCard({required this.points});

  final List<EmotionDistributionPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return EmptyState(
        icon: Icons.pie_chart_outline_rounded,
        title: t('metricsNoEmotionDataTitle'),
        body: t('metricsNoEmotionDataBody'),
        accentColor: AppColors.info,
      );
    }

    final total = points.fold<int>(0, (sum, point) => sum + point.count);

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: t('metricsEmotionDistribution'),
            subtitle: t('metricsEmotionDistributionSubtitle'),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 220,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 48,
                sections: [
                  for (var index = 0; index < points.length; index++)
                    PieChartSectionData(
                      value: points[index].count.toDouble(),
                      title: '${points[index].count}',
                      radius: 72,
                      color: _emotionColor(points[index].emotion, index),
                      titleStyle: Theme.of(
                        context,
                      ).textTheme.labelMedium?.copyWith(color: Colors.white),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          for (final point in points)
            _DistributionRow(
              label: Emotion.fromKey(
                point.emotion,
              ).label(AppLocalizations.currentLocale),
              value: '${point.count}',
              detail: '${_share(point.count, total).toStringAsFixed(1)}%',
              color: _emotionColor(point.emotion, points.indexOf(point)),
            ),
        ],
      ),
    );
  }
}

class _ResponseTimesCard extends StatelessWidget {
  const _ResponseTimesCard({required this.summary});

  final ResponseTimeSummary summary;

  @override
  Widget build(BuildContext context) {
    final samples = summary.samples.take(10).toList();

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: t('metricsResponseTimesTitle'),
            subtitle: t('metricsResponseTimesSubtitle'),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _MetricPill(
                label: t('metricsAverage'),
                value: '${summary.average} ${t('milliseconds')}',
                color: AppColors.primaryLight,
              ),
              _MetricPill(
                label: t('metricsMinimum'),
                value: '${summary.min} ${t('milliseconds')}',
                color: AppColors.success,
              ),
              _MetricPill(
                label: t('metricsMaximum'),
                value: '${summary.max} ${t('milliseconds')}',
                color: AppColors.warning,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (samples.isEmpty)
            _InlineEmpty(
              icon: Icons.speed_outlined,
              title: t('metricsResponseTimesEmptyTitle'),
              body: t('metricsResponseTimesEmptyBody'),
            )
          else
            SizedBox(
              height: 170,
              child: BarChart(
                BarChartData(
                  barTouchData: BarTouchData(enabled: false),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) => FlLine(
                      color: AppColors.border.withValues(alpha: 0.4),
                      strokeWidth: 1,
                    ),
                  ),
                  titlesData: const FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  barGroups: [
                    for (var index = 0; index < samples.length; index++)
                      BarChartGroupData(
                        x: index,
                        barRods: [
                          BarChartRodData(
                            toY: samples[index].responseTimeMs.toDouble(),
                            color: _emotionColor(samples[index].emotion, index),
                            borderRadius: BorderRadius.circular(8),
                            width: 14,
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DistributionPanels extends StatelessWidget {
  const _DistributionPanels({required this.bundle});

  final MetricsBundle bundle;

  @override
  Widget build(BuildContext context) {
    final raw = bundle.dashboard.raw;
    return Column(
      children: [
        _CompactRawList(
          title: t('metricsTopEmotionsTitle'),
          items: _asList(raw['topEmotions']),
          labelKey: 'key',
          valueKey: 'count',
          emptyText: t('metricsRawEmpty'),
        ),
        const SizedBox(height: 14),
        _CompactRawList(
          title: t('metricsModelDistributionTitle'),
          items: _asList(raw['modelDistribution']),
          labelKey: 'key',
          valueKey: 'count',
          emptyText: t('metricsRawEmpty'),
        ),
        const SizedBox(height: 14),
        _CompactRawList(
          title: t('metricsModalityDistributionTitle'),
          items: _asList(raw['modalityDistribution']),
          labelKey: 'key',
          valueKey: 'count',
          emptyText: t('metricsRawEmpty'),
        ),
        const SizedBox(height: 14),
        _CompactRawList(
          title: t('metricsDailyActivityTitle'),
          items: _asList(raw['dailyActivity']),
          labelKey: 'date',
          valueKey: 'count',
          emptyText: t('metricsRawEmpty'),
        ),
      ],
    );
  }
}

class _RecentAnalysesCard extends StatelessWidget {
  const _RecentAnalysesCard({required this.items});

  final List<Map<String, dynamic>> items;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: t('metricsRecentAnalysesTitle'),
            subtitle: t('metricsRecentAnalysesBody'),
          ),
          const SizedBox(height: 12),
          if (items.isEmpty)
            _InlineEmpty(
              icon: Icons.timeline_outlined,
              title: t('metricsRawEmpty'),
              body: t('metricsRecentAnalysesEmpty'),
            )
          else
            for (final item in items.take(6)) _RecentAnalysisRow(item: item),
        ],
      ),
    );
  }
}

class _RawMetricsCard extends StatelessWidget {
  const _RawMetricsCard({
    required this.title,
    required this.subtitle,
    required this.data,
  });

  final String title;
  final String subtitle;
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final rows = _flatten(data).toList();

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(title: title, subtitle: subtitle),
          const SizedBox(height: 12),
          if (rows.isEmpty)
            _InlineEmpty(
              icon: Icons.dataset_outlined,
              title: t('metricsRawEmpty'),
              body: t('metricsRawEmptyBody'),
            )
          else ...[
            for (final row in rows.take(32))
              _RawMetricRow(label: row.key, value: row.value),
            if (rows.length > 32)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  t(
                    'metricsRawTruncated',
                  ).replaceAll('{count}', '${rows.length - 32}'),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _MetricsAccessState extends StatelessWidget {
  const _MetricsAccessState({
    required this.icon,
    required this.title,
    required this.body,
    required this.primaryLabel,
    required this.primaryIcon,
    required this.onPrimary,
    required this.secondaryLabel,
    required this.secondaryIcon,
    required this.onSecondary,
  });

  final IconData icon;
  final String title;
  final String body;
  final String primaryLabel;
  final IconData primaryIcon;
  final VoidCallback onPrimary;
  final String secondaryLabel;
  final IconData secondaryIcon;
  final VoidCallback onSecondary;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: GlassmorphismCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(icon, color: AppColors.warning, size: 48),
              const SizedBox(height: 14),
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                body,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 18),
              PremiumButton(
                text: primaryLabel,
                icon: primaryIcon,
                onPressed: onPrimary,
              ),
              const SizedBox(height: 10),
              PremiumButton(
                text: secondaryLabel,
                icon: secondaryIcon,
                isSecondary: true,
                onPressed: onSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.data});

  final _MetricTileData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(data.icon, color: data.color, size: 22),
          const Spacer(),
          Text(
            data.value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            data.label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _DistributionRow extends StatelessWidget {
  const _DistributionRow({
    required this.label,
    required this.value,
    required this.detail,
    required this.color,
  });

  final String label;
  final String value;
  final String detail;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
          const SizedBox(width: 8),
          Text(
            '$value | $detail',
            style: Theme.of(context).textTheme.labelMedium,
          ),
        ],
      ),
    );
  }
}

class _CompactRawList extends StatelessWidget {
  const _CompactRawList({
    required this.title,
    required this.items,
    required this.labelKey,
    required this.valueKey,
    required this.emptyText,
  });

  final String title;
  final List<Map<String, dynamic>> items;
  final String labelKey;
  final String valueKey;
  final String emptyText;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          if (items.isEmpty)
            Text(
              emptyText,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            )
          else
            for (final item in items.take(8))
              _RawMetricRow(
                label:
                    (item[labelKey] ??
                            item['emotion'] ??
                            item['modality'] ??
                            '-')
                        .toString(),
                value: (item[valueKey] ?? item['value'] ?? item['count'] ?? '-')
                    .toString(),
              ),
        ],
      ),
    );
  }
}

class _RecentAnalysisRow extends StatelessWidget {
  const _RecentAnalysisRow({required this.item});

  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final emotion = (item['emotion'] ?? item['detectedEmotion'] ?? '')
        .toString();
    final emotionMeta = Emotion.fromKey(emotion);
    final confidence = _toDouble(item['confidence']);
    final modality = (item['modalityUsed'] ?? item['modality'] ?? '-')
        .toString();
    final createdAt = DateTime.tryParse((item['createdAt'] ?? '').toString());

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Icon(emotionMeta.icon, color: emotionMeta.color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  emotionMeta.label(AppLocalizations.currentLocale),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${_formatPercent(confidence)} | $modality | ${_formatDate(createdAt)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RawMetricRow extends StatelessWidget {
  const _RawMetricRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              _humanizeKey(label),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _HeroMiniStat extends StatelessWidget {
  const _HeroMiniStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 3),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _InlineEmpty extends StatelessWidget {
  const _InlineEmpty({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primaryLight, size: 34),
          const SizedBox(height: 8),
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _CsvDisabledNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.22)),
      ),
      child: Row(
        children: [
          const Icon(Icons.file_download_off_rounded, color: AppColors.warning),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              t('csvExportUnavailable'),
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.12),
      ),
    );
  }
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: AppColors.primaryLight,
        fontWeight: FontWeight.w900,
        letterSpacing: 0,
      ),
    );
  }
}

class _MetricTileData {
  const _MetricTileData(this.label, this.value, this.icon, this.color);

  final String label;
  final String value;
  final IconData icon;
  final Color color;
}

Iterable<MapEntry<String, String>> _flatten(
  Object? source, [
  String prefix = '',
]) sync* {
  if (source is Map) {
    for (final entry in source.entries) {
      final key = prefix.isEmpty
          ? entry.key.toString()
          : '$prefix.${entry.key}';
      if (entry.key == 'message') continue;
      yield* _flatten(entry.value, key);
    }
    return;
  }
  if (source is List) {
    for (var index = 0; index < source.length; index++) {
      yield* _flatten(source[index], '$prefix[$index]');
    }
    if (source.isEmpty && prefix.isNotEmpty) {
      yield MapEntry(prefix, '[]');
    }
    return;
  }
  if (source != null && prefix.isNotEmpty) {
    yield MapEntry(prefix, source.toString());
  }
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return const {};
}

List<Map<String, dynamic>> _asList(Object? value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((item) => item.map((key, value) => MapEntry(key.toString(), value)))
      .toList();
}

int? _readInt(Map<String, dynamic> source, List<String> keys) {
  for (final key in keys) {
    final value = source[key];
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
  }
  return null;
}

double? _readDouble(Map<String, dynamic> source, List<String> keys) {
  for (final key in keys) {
    final value = source[key];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
  }
  return null;
}

double _toDouble(Object? value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

double _share(num value, num total) {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

String _formatRating(double value) {
  return value <= 0 ? '0/5' : '${value.toStringAsFixed(2)}/5';
}

String _formatPercent(double value) {
  final percent = value <= 1 ? value * 100 : value;
  return '${percent.clamp(0, 100).toStringAsFixed(1)}%';
}

String _formatDate(DateTime? value) {
  if (value == null) return '-';
  final locale = AppLocalizations.currentLocale == 'en' ? 'en' : 'tr';
  final pattern = locale == 'en' ? 'MMM d, HH:mm' : 'dd.MM HH:mm';
  return DateFormat(pattern, locale).format(value.toLocal());
}

String _humanizeKey(String key) {
  final withSpaces = key
      .replaceAll('_', ' ')
      .replaceAll('.', ' / ')
      .replaceAllMapped(
        RegExp(r'([a-z])([A-Z])'),
        (match) => '${match.group(1)} ${match.group(2)}',
      );
  return withSpaces.isEmpty
      ? withSpaces
      : '${withSpaces[0].toUpperCase()}${withSpaces.substring(1)}';
}

Color _emotionColor(String emotion, int index) {
  final emotionColor = AppColors.emotionColors[emotion.toLowerCase()];
  if (emotionColor != null) return emotionColor;

  const colors = [
    AppColors.primary,
    AppColors.secondary,
    AppColors.accent,
    AppColors.success,
    AppColors.warning,
    AppColors.info,
  ];
  return colors[index % colors.length];
}
