/// Web-canonical history page with auth state, summary, filters, and timeline.
library;

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
import '../../../core/widgets/emotion_badge.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_state.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../domain/history_models.dart';
import 'providers/history_provider.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  final _scrollController = ScrollController();
  String _selectedEmotion = 'all';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authProvider).isAuthenticated) {
        ref.read(historyListProvider.notifier).loadInitial();
      }
    });
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 260) {
      ref.read(historyListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated && previous?.isAuthenticated != true) {
        ref.read(historyListProvider.notifier).loadInitial();
      }
    });

    final authState = ref.watch(authProvider);
    final state = ref.watch(historyListProvider);

    if (authState.isAuthenticated && state.status == HistoryStatus.idle) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) ref.read(historyListProvider.notifier).loadInitial();
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(t('historyTitle')),
        actions: [
          IconButton(
            tooltip: t('refresh'),
            onPressed: authState.isAuthenticated
                ? () => ref.read(historyListProvider.notifier).refresh()
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
              ? _HistoryGuestState(
                  onLogin: () => context.go(
                    '/login?from=${Uri.encodeComponent('/history')}',
                  ),
                  onRegister: () => context.go(
                    '/register?from=${Uri.encodeComponent('/history')}',
                  ),
                )
              : _HistoryBody(
                  controller: _scrollController,
                  state: state,
                  selectedEmotion: _selectedEmotion,
                  onEmotionSelected: (emotion) {
                    setState(() => _selectedEmotion = emotion);
                  },
                  onRefresh: () =>
                      ref.read(historyListProvider.notifier).refresh(),
                  onRetry: () =>
                      ref.read(historyListProvider.notifier).loadInitial(),
                  onLoadMore: () =>
                      ref.read(historyListProvider.notifier).loadMore(),
                ),
        ),
      ),
    );
  }
}

class _HistoryBody extends StatelessWidget {
  const _HistoryBody({
    required this.controller,
    required this.state,
    required this.selectedEmotion,
    required this.onEmotionSelected,
    required this.onRefresh,
    required this.onRetry,
    required this.onLoadMore,
  });

  final ScrollController controller;
  final HistoryState state;
  final String selectedEmotion;
  final ValueChanged<String> onEmotionSelected;
  final Future<void> Function() onRefresh;
  final VoidCallback onRetry;
  final VoidCallback onLoadMore;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && state.items.isEmpty) {
      return Center(child: AnimatedLoading(message: t('historyLoading')));
    }

    if (state.status == HistoryStatus.failure && state.items.isEmpty) {
      return _HistoryError(message: state.errorMessage, onRetry: onRetry);
    }

    final summary = _HistorySummaryData.fromState(state);
    final filteredItems = selectedEmotion == 'all'
        ? state.items
        : state.items
              .where((item) => item.emotion.toLowerCase() == selectedEmotion)
              .toList();

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        controller: controller,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
        children: [
          _HistoryHero(summary: summary),
          const SizedBox(height: 14),
          _SummaryGrid(summary: summary),
          const SizedBox(height: 14),
          _EmotionFilter(
            items: state.items,
            selectedEmotion: selectedEmotion,
            onChanged: onEmotionSelected,
          ),
          if (state.status == HistoryStatus.failure &&
              state.errorMessage != null) ...[
            const SizedBox(height: 12),
            _InlineError(message: state.errorMessage!, onRetry: onRetry),
          ],
          const SizedBox(height: 14),
          if (state.isEmpty)
            _HistoryEmpty(onAnalyze: () => context.go('/analyze'))
          else if (filteredItems.isEmpty)
            _FilterEmpty(onClear: () => onEmotionSelected('all'))
          else ...[
            _TimelineList(items: filteredItems),
            if (state.isLoadingMore)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: AnimatedLoading(message: t('historyLoadingMore')),
              )
            else if (state.hasMore)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: OutlinedButton.icon(
                  onPressed: onLoadMore,
                  icon: const Icon(Icons.expand_more_rounded),
                  label: Text(t('historyLoadMore')),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _TimelineList extends StatelessWidget {
  const _TimelineList({required this.items});

  final List<HistoryItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final entry in items.indexed) ...[
          _HistoryCard(item: entry.$2, index: entry.$1),
          if (entry.$1 != items.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _HistoryHero extends StatelessWidget {
  const _HistoryHero({required this.summary});

  final _HistorySummaryData summary;

  @override
  Widget build(BuildContext context) {
    final topEmotion = summary.topEmotion;
    final accent = topEmotion?.color ?? AppColors.primaryLight;

    return GlassmorphismCard(
      padding: const EdgeInsets.all(20),
      borderColor: accent.withValues(alpha: 0.28),
      child: Stack(
        children: [
          Positioned(
            right: -42,
            top: -42,
            child:
                Container(
                      width: 132,
                      height: 132,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: accent.withValues(alpha: 0.15),
                      ),
                    )
                    .animate(
                      onPlay: (controller) => controller.repeat(reverse: true),
                    )
                    .scale(
                      begin: const Offset(0.94, 0.94),
                      end: const Offset(1.08, 1.08),
                      duration: 2400.ms,
                    ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Eyebrow(text: t('historyHeroEyebrow')),
              const SizedBox(height: 14),
              Text(
                t('historyHeroTitle'),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                t('historyHeroTitleSuffix'),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: accent,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                t('historyHeroDescription'),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(
                    topEmotion?.icon ?? Icons.timeline_rounded,
                    color: accent,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _format('historyHeroPulse', {
                        'emotion':
                            topEmotion?.label(AppLocalizations.currentLocale) ??
                            t('historyNoTopEmotion'),
                      }),
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                  ),
                  PremiumButton(
                    text: t('historyNewAnalysis'),
                    icon: Icons.auto_awesome_rounded,
                    onPressed: () => context.go('/analyze'),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 420.ms).slideY(begin: 0.05, end: 0);
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.summary});

  final _HistorySummaryData summary;

  @override
  Widget build(BuildContext context) {
    final items = [
      _SummaryItem(
        t('historyLoadedCount'),
        '${summary.loadedCount}',
        Icons.list_alt_rounded,
        AppColors.primaryLight,
      ),
      _SummaryItem(
        t('historyTotalCount'),
        '${summary.totalCount}',
        Icons.storage_rounded,
        AppColors.info,
      ),
      _SummaryItem(
        t('historyTopEmotion'),
        summary.topEmotion?.label(AppLocalizations.currentLocale) ?? '-',
        summary.topEmotion?.icon ?? Icons.auto_awesome_rounded,
        summary.topEmotion?.color ?? AppColors.primary,
      ),
      _SummaryItem(
        t('historyAverageConfidence'),
        '${(summary.averageConfidence * 100).round()}%',
        Icons.speed_rounded,
        AppColors.success,
      ),
      _SummaryItem(
        t('historyMultimodalCount'),
        '${summary.multimodalCount}',
        Icons.hub_rounded,
        AppColors.secondaryLight,
      ),
      _SummaryItem(
        t('historyFaceSignals'),
        '${summary.faceDetectedCount}',
        Icons.face_rounded,
        AppColors.warning,
      ),
      _SummaryItem(
        t('historyLatestDate'),
        summary.latestDateText,
        Icons.schedule_rounded,
        AppColors.accentLight,
      ),
    ];

    return GridView.builder(
      itemCount: items.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 2.35,
      ),
      itemBuilder: (context, index) {
        return _SummaryTile(item: items[index]);
      },
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.item});

  final _SummaryItem item;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(12),
      borderColor: item.color.withValues(alpha: 0.22),
      child: Row(
        children: [
          Icon(item.icon, color: item.color, size: 22),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  item.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: item.color,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
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

class _EmotionFilter extends StatelessWidget {
  const _EmotionFilter({
    required this.items,
    required this.selectedEmotion,
    required this.onChanged,
  });

  final List<HistoryItem> items;
  final String selectedEmotion;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final counts = <String, int>{};
    for (final item in items) {
      final key = item.emotion.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('historyFilterTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 5),
          Text(
            t('historyFilterDescription'),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChipButton(
                  label: t('historyAllEmotions'),
                  selected: selectedEmotion == 'all',
                  count: items.length,
                  onTap: () => onChanged('all'),
                ),
                for (final emotion in Emotion.values)
                  _FilterChipButton(
                    label:
                        '${emotion.emoji} ${emotion.label(AppLocalizations.currentLocale)}',
                    selected: selectedEmotion == emotion.key,
                    count: counts[emotion.key] ?? 0,
                    onTap: () => onChanged(emotion.key),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChipButton extends StatelessWidget {
  const _FilterChipButton({
    required this.label,
    required this.selected,
    required this.count,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        selected: selected,
        onSelected: (_) => onTap(),
        label: Text('$label ($count)'),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item, required this.index});

  final HistoryItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    final emotion = Emotion.fromKey(item.emotion);
    final confidencePercent = (item.confidence.clamp(0, 1) * 100).round();
    final explanation = item.explanation?.trim();
    final userText = item.userText?.trim();

    return InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => context.go('/result/${item.id}'),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 28,
                child: Column(
                  children: [
                    Container(
                      width: 13,
                      height: 13,
                      margin: const EdgeInsets.only(top: 26),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: emotion.color,
                        boxShadow: [
                          BoxShadow(
                            color: emotion.color.withValues(alpha: 0.45),
                            blurRadius: 18,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 130,
                      color: AppColors.border.withValues(alpha: 0.55),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: GlassmorphismCard(
                  padding: const EdgeInsets.all(16),
                  borderColor: emotion.color.withValues(alpha: 0.22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: EmotionBadge(emotionKey: item.emotion),
                          ),
                          const SizedBox(width: 8),
                          _ConfidencePill(
                            percent: confidencePercent,
                            color: emotion.color,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (explanation != null && explanation.isNotEmpty)
                        Text(
                          explanation,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium,
                        )
                      else
                        Text(
                          t('noExplanation'),
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                      if (userText != null && userText.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          userText,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppColors.textTertiary,
                                height: 1.35,
                              ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _MetaPill(
                            icon: Icons.schedule_rounded,
                            label: _formatDateTime(item.createdAt),
                          ),
                          _MetaPill(
                            icon: Icons.tune_rounded,
                            label: _modalityLabel(item.modalityUsed),
                          ),
                          _MetaPill(
                            icon: Icons.face_rounded,
                            label: item.faceDetected
                                ? t('faceDetected')
                                : t('faceNotDetected'),
                          ),
                          _MetaPill(
                            icon: Icons.memory_rounded,
                            label: _shortModel(item.modelUsed),
                          ),
                          if (item.responseTimeMs != null)
                            _MetaPill(
                              icon: Icons.timer_outlined,
                              label:
                                  '${item.responseTimeMs} ${t('milliseconds')}',
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          t('historyViewResult'),
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(color: emotion.color),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        )
        .animate(delay: (35 * index).ms)
        .fadeIn(duration: 240.ms)
        .slideY(begin: 0.04, end: 0);
  }
}

class _ConfidencePill extends StatelessWidget {
  const _ConfidencePill({required this.percent, required this.color});

  final int percent;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        '$percent%',
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: color,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.52),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppColors.textSecondary),
            const SizedBox(width: 6),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 190),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryEmpty extends StatelessWidget {
  const _HistoryEmpty({required this.onAnalyze});

  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.history_rounded,
      title: t('historyEmptyTitle'),
      body: t('historyEmptyBody'),
      actionLabel: t('historyStartFirstAnalysis'),
      actionIcon: Icons.auto_awesome_rounded,
      onAction: onAnalyze,
    );
  }
}

class _FilterEmpty extends StatelessWidget {
  const _FilterEmpty({required this.onClear});

  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.filter_alt_off_rounded,
      title: t('historyFilterEmptyTitle'),
      body: t('historyFilterEmptyBody'),
      actionLabel: t('historyResetFilter'),
      actionIcon: Icons.close_rounded,
      onAction: onClear,
      accentColor: AppColors.warning,
    );
  }
}

class _HistoryError extends StatelessWidget {
  const _HistoryError({required this.message, required this.onRetry});

  final String? message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ErrorState(
        title: t('historyLoadError'),
        body: message ?? t('historyLoadError'),
        actionLabel: t('retry'),
        onAction: onRetry,
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(14),
      fillColor: AppColors.error.withValues(alpha: 0.10),
      borderColor: AppColors.error.withValues(alpha: 0.24),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppColors.error),
          const SizedBox(width: 10),
          Expanded(child: Text(message)),
          TextButton(onPressed: onRetry, child: Text(t('retry'))),
        ],
      ),
    );
  }
}

class _HistoryGuestState extends StatelessWidget {
  const _HistoryGuestState({required this.onLogin, required this.onRegister});

  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GlassmorphismCard(
        margin: const EdgeInsets.all(20),
        padding: const EdgeInsets.all(20),
        borderColor: AppColors.warning.withValues(alpha: 0.28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              Icons.lock_outline_rounded,
              size: 46,
              color: AppColors.warning,
            ),
            const SizedBox(height: 12),
            Text(
              t('historyGuestTitle'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              t('historyGuestBody'),
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 18),
            PremiumButton(
              text: t('login'),
              icon: Icons.login_rounded,
              onPressed: onLogin,
            ),
            const SizedBox(height: 10),
            PremiumButton(
              text: t('register'),
              icon: Icons.person_add_alt_rounded,
              isSecondary: true,
              onPressed: onRegister,
            ),
          ],
        ),
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
      text,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: AppColors.primaryLight,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _HistorySummaryData {
  const _HistorySummaryData({
    required this.loadedCount,
    required this.totalCount,
    required this.topEmotion,
    required this.averageConfidence,
    required this.multimodalCount,
    required this.faceDetectedCount,
    required this.latestDate,
  });

  final int loadedCount;
  final int totalCount;
  final Emotion? topEmotion;
  final double averageConfidence;
  final int multimodalCount;
  final int faceDetectedCount;
  final DateTime? latestDate;

  String get latestDateText {
    if (latestDate == null) return '-';
    return _formatDateTime(latestDate!);
  }

  factory _HistorySummaryData.fromState(HistoryState state) {
    final items = state.items;
    final counts = <String, int>{};
    var multimodalCount = 0;
    var faceDetectedCount = 0;
    var confidenceSum = 0.0;
    DateTime? latestDate;

    for (final item in items) {
      final key = item.emotion.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
      if (item.modalityUsed.toLowerCase().contains('multi')) {
        multimodalCount += 1;
      }
      if (item.faceDetected) faceDetectedCount += 1;
      confidenceSum += item.confidence;
      if (latestDate == null || item.createdAt.isAfter(latestDate)) {
        latestDate = item.createdAt;
      }
    }

    String? topKey;
    if (counts.isNotEmpty) {
      final entries = counts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      topKey = entries.first.key;
    }

    return _HistorySummaryData(
      loadedCount: items.length,
      totalCount: state.total > 0 ? state.total : items.length,
      topEmotion: topKey == null ? null : Emotion.fromKey(topKey),
      averageConfidence: items.isEmpty ? 0 : confidenceSum / items.length,
      multimodalCount: multimodalCount,
      faceDetectedCount: faceDetectedCount,
      latestDate: latestDate,
    );
  }
}

class _SummaryItem {
  const _SummaryItem(this.label, this.value, this.icon, this.color);

  final String label;
  final String value;
  final IconData icon;
  final Color color;
}

String _formatDateTime(DateTime value) {
  final isEnglish = AppLocalizations.currentLocale == 'en';
  final pattern = isEnglish ? 'MMM d, yyyy HH:mm' : 'dd.MM.yyyy HH:mm';
  return DateFormat(pattern).format(value.toLocal());
}

String _modalityLabel(String value) {
  return switch (value.toLowerCase()) {
    'multimodal' => t('historyTypeMultimodal'),
    'image' => t('historyTypeImage'),
    'text' => t('historyTypeText'),
    _ => value.isEmpty ? t('historyTypeMissing') : value,
  };
}

String _shortModel(String value) {
  if (value.isEmpty) return 'model';
  if (value.length <= 18) return value;
  return '${value.substring(0, 18)}...';
}

String _format(String key, Map<String, Object> values) {
  var text = t(key);
  for (final entry in values.entries) {
    text = text.replaceAll('{${entry.key}}', entry.value.toString());
  }
  return text;
}
