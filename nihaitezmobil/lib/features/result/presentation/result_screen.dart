/// Web-canonical result page with recommendation explorer, feedback, and share.
library;

import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/constants/emotion_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/animated_loading.dart';
import '../../../core/widgets/confidence_ring.dart';
import '../../../core/widgets/emotion_badge.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../analyze/domain/analysis_models.dart';
import '../../analyze/presentation/providers/analyze_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../../feedback/domain/feedback_models.dart';
import '../../feedback/presentation/providers/feedback_provider.dart';
import '../../history/domain/history_models.dart';
import '../../history/presentation/providers/history_provider.dart';
import '../domain/recommendation_models.dart';
import '../domain/saved_recommendation.dart';
import 'providers/result_provider.dart';
import 'providers/saved_recommendations_provider.dart';

class ResultScreen extends ConsumerWidget {
  const ResultScreen({super.key, required this.historyId});

  final String historyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latestResult = ref.watch(analyzeProvider).result;
    final matchingResult = latestResult?.historyId == historyId
        ? latestResult
        : null;

    return Scaffold(
      appBar: AppBar(title: Text(t('resultTitle'))),
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: matchingResult != null
              ? _ResultContent(data: _ResultData.fromAnalysis(matchingResult))
              : _FallbackResultContent(historyId: historyId),
        ),
      ),
    );
  }
}

class _FallbackResultContent extends ConsumerWidget {
  const _FallbackResultContent({required this.historyId});

  final String historyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(resultDetailProvider(historyId));
    final history = ref.watch(historyItemProvider(historyId));

    return detail.when(
      data: (resultDetail) => _ResultContent(
        data: _ResultData.fromDetail(resultDetail),
        notice: t('resultFallbackLoaded'),
      ),
      loading: () => history.when(
        data: (item) => _ResultContent(
          data: _ResultData.fromHistory(item),
          notice: t('resultFallbackHistoryOnly'),
        ),
        loading: () => _ResultLoading(message: t('resultFallbackLoading')),
        error: (_, _) => _ResultLoading(message: t('resultFallbackLoading')),
      ),
      error: (_, _) => history.when(
        data: (item) => _ResultContent(
          data: _ResultData.fromHistory(item),
          notice: t('resultFallbackHistoryOnly'),
        ),
        loading: () => _ResultLoading(message: t('resultFallbackLoading')),
        error: (_, _) => _ResultEmpty(historyId: historyId),
      ),
    );
  }
}

class _ResultContent extends ConsumerStatefulWidget {
  const _ResultContent({required this.data, this.notice});

  final _ResultData data;
  final String? notice;

  @override
  ConsumerState<_ResultContent> createState() => _ResultContentState();
}

class _ResultContentState extends ConsumerState<_ResultContent> {
  final _shareKey = GlobalKey();
  String _activeTab = 'music';

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final emotion = Emotion.fromKey(data.emotion);
    final accent = emotion.color;
    final isAuthenticated = ref.watch(authProvider).isAuthenticated;
    final savedItems = ref.watch(savedRecommendationsProvider);
    final savedCountForResult = savedItems
        .where((item) => item.sourceHistoryId == data.historyId)
        .length;
    final sharePayload = _SharePayload.fromData(data);

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
      children: [
        if (widget.notice != null) ...[
          _NoticeCard(message: widget.notice!),
          const SizedBox(height: 12),
        ],
        _ResultHero(data: data, emotion: emotion, accent: accent),
        const SizedBox(height: 14),
        _InsightPanel(data: data, emotion: emotion, accent: accent),
        const SizedBox(height: 14),
        _MetadataGrid(data: data, accent: accent),
        const SizedBox(height: 14),
        RepaintBoundary(
          key: _shareKey,
          child: _ResultSharePreview(payload: sharePayload, accent: accent),
        ),
        const SizedBox(height: 12),
        _ShareActions(shareKey: _shareKey, payload: sharePayload),
        const SizedBox(height: 14),
        _RecommendationExplorer(
          bundle: data.recommendations,
          activeTab: _activeTab,
          accent: accent,
          emotion: emotion,
          sourceHistoryId: data.historyId,
          onTabChanged: (tab) => setState(() => _activeTab = tab),
        ),
        if (data.historyId != null && data.historyId!.isNotEmpty) ...[
          const SizedBox(height: 14),
          _FeedbackPanel(historyId: data.historyId!, accent: accent),
        ],
        const SizedBox(height: 14),
        _NextStepCtas(
          historyId: data.historyId,
          isAuthenticated: isAuthenticated,
          savedCount: savedCountForResult,
          accent: accent,
        ),
      ],
    );
  }
}

class _ResultHero extends StatelessWidget {
  const _ResultHero({
    required this.data,
    required this.emotion,
    required this.accent,
  });

  final _ResultData data;
  final Emotion emotion;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(20),
      fillColor: accent.withValues(alpha: 0.08),
      borderColor: accent.withValues(alpha: 0.28),
      child: Stack(
        children: [
          Positioned(
            right: -46,
            top: -36,
            child: _AtmosphereOrb(color: accent, size: 138),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        _Pill(label: t('resultAiComplete'), color: accent),
                        EmotionBadge(emotionKey: emotion.key),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(emotion.emoji, style: const TextStyle(fontSize: 58)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          emotion.label(AppLocalizations.currentLocale),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: accent,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          t('resultCustomResult'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                  ),
                  ConfidenceRing(
                    value: data.confidence,
                    size: 104,
                    label: t('confidence'),
                    color: accent,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                _emotionTone(emotion),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 420.ms).slideY(begin: 0.05, end: 0);
  }
}

class _InsightPanel extends StatelessWidget {
  const _InsightPanel({
    required this.data,
    required this.emotion,
    required this.accent,
  });

  final _ResultData data;
  final Emotion emotion;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (data.warning != null && data.warning!.isNotEmpty) ...[
          _NarrativeCard(
            icon: Icons.warning_amber_rounded,
            title: t('resultWarningNote'),
            text: data.warning!,
            accent: AppColors.warning,
          ),
          const SizedBox(height: 12),
        ],
        _NarrativeCard(
          icon: emotion.icon,
          title: t('resultInsightPanel'),
          text: data.explanation.isEmpty
              ? _coachPrompt(emotion)
              : data.explanation,
          accent: accent,
        ),
      ],
    );
  }
}

class _NarrativeCard extends StatelessWidget {
  const _NarrativeCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.accent,
  });

  final IconData icon;
  final String title;
  final String text;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      borderColor: accent.withValues(alpha: 0.28),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: accent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 6),
                Text(
                  text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.45,
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

class _MetadataGrid extends StatelessWidget {
  const _MetadataGrid({required this.data, required this.accent});

  final _ResultData data;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final items = [
      _MetricItem(t('modalityUsed'), _modeLabel(data.modalityUsed)),
      _MetricItem(t('modelUsed'), data.modelUsed),
      _MetricItem(
        t('responseTime'),
        data.responseTimeMs == null
            ? '-'
            : '${data.responseTimeMs} ${t('milliseconds')}',
      ),
      _MetricItem(
        t('faceStatus'),
        data.faceDetected ? t('faceDetected') : t('faceNotDetected'),
      ),
      _MetricItem(t('resultHistoryId'), data.historyId ?? '-'),
      _MetricItem(
        t('confidence'),
        '${(data.confidence.clamp(0, 1) * 100).round()}%',
      ),
    ];

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('resultMetadataTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          GridView.builder(
            itemCount: items.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.28,
            ),
            itemBuilder: (context, index) {
              return _MetricTile(item: items[index], accent: accent);
            },
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.item, required this.accent});

  final _MetricItem item;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.36),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.52)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            item.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textTertiary),
          ),
          const SizedBox(height: 4),
          Text(
            item.value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: accent,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecommendationExplorer extends StatelessWidget {
  const _RecommendationExplorer({
    required this.bundle,
    required this.activeTab,
    required this.accent,
    required this.emotion,
    required this.sourceHistoryId,
    required this.onTabChanged,
  });

  final RecommendationBundle bundle;
  final String activeTab;
  final Color accent;
  final Emotion emotion;
  final String? sourceHistoryId;
  final ValueChanged<String> onTabChanged;

  @override
  Widget build(BuildContext context) {
    final categories = _recommendationCategories(bundle);
    final active = categories.firstWhere(
      (category) => category.key == activeTab,
      orElse: () => categories.first,
    );
    final total = categories.fold<int>(
      0,
      (sum, category) => sum + category.items.length,
    );

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SectionEyebrow(text: t('resultRecommendationExplorer')),
                    const SizedBox(height: 8),
                    Text(
                      t('resultSelectedForYou'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 5),
                    Text(
                      _format('resultRecommendationCount', {'count': total}),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              _Pill(
                label: emotion.label(AppLocalizations.currentLocale),
                color: accent,
              ),
            ],
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final category in categories) ...[
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      selected: category.key == active.key,
                      onSelected: (_) => onTabChanged(category.key),
                      label: Text(
                        '${category.label} (${category.items.length})',
                      ),
                      avatar: Icon(category.icon, size: 16),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            active.description,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          if (active.items.isEmpty)
            _EmptyRecommendation(category: active.label, accent: accent)
          else
            for (final item in active.items.indexed) ...[
              _RecommendationCard(
                item: item.$2,
                accent: accent,
                emotion: emotion,
                sourceHistoryId: sourceHistoryId,
              ).animate(delay: (45 * item.$1).ms).fadeIn().slideX(begin: 0.04),
              if (item.$1 != active.items.length - 1)
                const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}

class _RecommendationCard extends ConsumerWidget {
  const _RecommendationCard({
    required this.item,
    required this.accent,
    required this.emotion,
    required this.sourceHistoryId,
  });

  final _RecommendationItem item;
  final Color accent;
  final Emotion emotion;
  final String? sourceHistoryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = createSavedRecommendationId(
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      sourceHistoryId: sourceHistoryId,
    );
    final saved = ref
        .watch(savedRecommendationsProvider)
        .any((savedItem) => savedItem.id == id);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.46),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.58)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _RecommendationCover(item: item, accent: accent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                if (item.subtitle != null && item.subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                if (item.reason != null && item.reason!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    item.reason!,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                      height: 1.38,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    TextButton.icon(
                      onPressed: () => _toggleSaved(context, ref, id),
                      icon: Icon(
                        saved ? Icons.bookmark : Icons.bookmark_border,
                        size: 18,
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: saved ? AppColors.success : accent,
                        backgroundColor: saved
                            ? AppColors.success.withValues(alpha: 0.10)
                            : accent.withValues(alpha: 0.10),
                      ),
                      label: Text(saved ? t('saved') : t('save')),
                    ),
                    if (item.externalUrl != null)
                      TextButton.icon(
                        onPressed: () => _openExternal(context),
                        icon: const Icon(Icons.open_in_new_rounded, size: 18),
                        label: Text(t('openExternal')),
                      ),
                  ],
                ),
                if (item.source != null || item.category != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    [
                      item.source,
                      item.category,
                    ].whereType<String>().join(' / '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleSaved(
    BuildContext context,
    WidgetRef ref,
    String id,
  ) async {
    final saved = await ref
        .read(savedRecommendationsProvider.notifier)
        .toggle(
          SavedRecommendation(
            id: id,
            type: item.type,
            title: item.title,
            subtitle: item.subtitle,
            reason: item.reason,
            imageUrl: item.imageUrl,
            externalUrl: item.externalUrl,
            emotion: emotion.key,
            sourceHistoryId: sourceHistoryId,
            createdAt: DateTime.now(),
          ),
        );

    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            saved ? t('recommendationSaved') : t('recommendationRemoved'),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  Future<void> _openExternal(BuildContext context) async {
    final url = item.externalUrl;
    final uri = url == null ? null : Uri.tryParse(url);
    if (uri == null ||
        !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(t('resultExternalOpenFailed')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
    }
  }
}

class _RecommendationCover extends StatelessWidget {
  const _RecommendationCover({required this.item, required this.accent});

  final _RecommendationItem item;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final imageUrl = item.imageUrl;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Image.network(
          imageUrl,
          width: 68,
          height: 88,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => _FallbackCover(item: item, accent: accent),
        ),
      );
    }

    return _FallbackCover(item: item, accent: accent);
  }
}

class _FallbackCover extends StatelessWidget {
  const _FallbackCover({required this.item, required this.accent});

  final _RecommendationItem item;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 68,
      height: 88,
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Icon(item.icon, color: accent),
    );
  }
}

class _FeedbackPanel extends ConsumerStatefulWidget {
  const _FeedbackPanel({required this.historyId, required this.accent});

  final String historyId;
  final Color accent;

  @override
  ConsumerState<_FeedbackPanel> createState() => _FeedbackPanelState();
}

class _FeedbackPanelState extends ConsumerState<_FeedbackPanel> {
  int _overall = 0;
  int _accuracy = 0;
  int _quality = 0;
  bool _helpful = true;
  bool _wouldReuse = true;
  final _commentController = TextEditingController();
  bool _requestedLoad = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requestedLoad) return;
    _requestedLoad = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(feedbackProvider(widget.historyId).notifier).load();
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedbackProvider(widget.historyId));
    final feedback = state.feedback;

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      borderColor: widget.accent.withValues(alpha: 0.24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SectionEyebrow(text: t('resultFeedbackEyebrow')),
          const SizedBox(height: 8),
          Text(
            t('feedbackTitle'),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 6),
          Text(
            t('feedbackDescription'),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),
          if (state.isLoading)
            AnimatedLoading(message: t('loading'))
          else if (feedback != null)
            _FeedbackSummary(feedback: feedback, accent: widget.accent)
          else ...[
            _RatingSelector(
              label: t('overallRating'),
              value: _overall,
              accent: widget.accent,
              onChanged: (value) => setState(() => _overall = value),
            ),
            const SizedBox(height: 10),
            _RatingSelector(
              label: t('analysisAccuracyRating'),
              value: _accuracy,
              accent: widget.accent,
              onChanged: (value) => setState(() => _accuracy = value),
            ),
            const SizedBox(height: 10),
            _RatingSelector(
              label: t('recommendationQualityRating'),
              value: _quality,
              accent: widget.accent,
              onChanged: (value) => setState(() => _quality = value),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              value: _helpful,
              onChanged: (value) => setState(() => _helpful = value),
              title: Text(t('feedbackHelpful')),
              contentPadding: EdgeInsets.zero,
            ),
            SwitchListTile(
              value: _wouldReuse,
              onChanged: (value) => setState(() => _wouldReuse = value),
              title: Text(t('feedbackWouldReuse')),
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              minLines: 2,
              maxLines: 4,
              maxLength: 280,
              decoration: InputDecoration(
                labelText: t('feedbackCommentLabel'),
                hintText: t('feedbackCommentHint'),
              ),
            ),
            if (state.errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                state.errorMessage!,
                style: const TextStyle(color: AppColors.error),
              ),
            ],
            const SizedBox(height: 12),
            PremiumButton(
              text: state.isSubmitting ? t('saving') : t('submitFeedback'),
              icon: Icons.rate_review_rounded,
              isLoading: state.isSubmitting,
              onPressed: _canSubmit && !state.isSubmitting
                  ? () => _submitFeedback(context)
                  : null,
            ),
          ],
        ],
      ),
    );
  }

  bool get _canSubmit => _overall > 0 && _accuracy > 0 && _quality > 0;

  Future<void> _submitFeedback(BuildContext context) async {
    await ref
        .read(feedbackProvider(widget.historyId).notifier)
        .submit(
          FeedbackRequest(
            overallRating: _overall,
            analysisAccuracyRating: _accuracy,
            recommendationQualityRating: _quality,
            helpful: _helpful,
            wouldReuse: _wouldReuse,
            comment: _commentController.text,
          ),
        );
    final state = ref.read(feedbackProvider(widget.historyId));
    if (!context.mounted || state.feedback == null) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(t('feedbackSaved')),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _FeedbackSummary extends StatelessWidget {
  const _FeedbackSummary({required this.feedback, required this.accent});

  final FeedbackResponse feedback;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: AppColors.success),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  t('resultFeedbackAlreadySubmitted'),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _Pill(
                label: '${t('overallRating')}: ${feedback.overallRating}/5',
                color: accent,
              ),
              _Pill(
                label:
                    '${t('analysisAccuracyRating')}: ${feedback.analysisAccuracyRating}/5',
                color: accent,
              ),
              _Pill(
                label:
                    '${t('recommendationQualityRating')}: ${feedback.recommendationQualityRating}/5',
                color: accent,
              ),
            ],
          ),
          if (feedback.comment != null && feedback.comment!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              feedback.comment!,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ],
      ),
    );
  }
}

class _RatingSelector extends StatelessWidget {
  const _RatingSelector({
    required this.label,
    required this.value,
    required this.accent,
    required this.onChanged,
  });

  final String label;
  final int value;
  final Color accent;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        Row(
          children: [
            for (var rating = 1; rating <= 5; rating++)
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: rating == 5 ? 0 : 6),
                  child: InkWell(
                    onTap: () => onChanged(rating),
                    borderRadius: BorderRadius.circular(14),
                    child: AnimatedContainer(
                      duration: AppConstants.animFast,
                      height: 42,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: value == rating
                            ? accent
                            : AppColors.card.withValues(alpha: 0.42),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: value == rating
                              ? accent
                              : AppColors.border.withValues(alpha: 0.55),
                        ),
                      ),
                      child: Text(
                        '$rating',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: value == rating
                              ? Colors.black
                              : AppColors.textSecondary,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _NextStepCtas extends StatelessWidget {
  const _NextStepCtas({
    required this.historyId,
    required this.isAuthenticated,
    required this.savedCount,
    required this.accent,
  });

  final String? historyId;
  final bool isAuthenticated;
  final int savedCount;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('resultNextTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            _format('resultSavedCountForResult', {'count': savedCount}),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ActionChipButton(
                icon: Icons.refresh_rounded,
                label: t('newAnalysis'),
                onPressed: () => context.go('/analyze'),
              ),
              _ActionChipButton(
                icon: Icons.history_rounded,
                label: t('goHistory'),
                onPressed: () => context.go('/history'),
              ),
              _ActionChipButton(
                icon: Icons.bookmarks_rounded,
                label: t('savedRecommendations'),
                onPressed: () => context.go('/profile'),
              ),
              if (!isAuthenticated)
                _ActionChipButton(
                  icon: Icons.login_rounded,
                  label: t('loginToSave'),
                  onPressed: () {
                    final target = historyId == null
                        ? '/result'
                        : '/result/$historyId';
                    context.go('/login?from=${Uri.encodeComponent(target)}');
                  },
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionChipButton extends StatelessWidget {
  const _ActionChipButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(label),
    );
  }
}

class _ResultSharePreview extends StatelessWidget {
  const _ResultSharePreview({required this.payload, required this.accent});

  final _SharePayload payload;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF06131F),
            Color.alphaBlend(
              accent.withValues(alpha: 0.20),
              const Color(0xFF102238),
            ),
            const Color(0xFF201733),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.glassBorder),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.20),
            blurRadius: 28,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppColors.primaryLight),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    AppConstants.appName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  payload.formattedDate,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Text(
                  payload.emotionEmoji,
                  style: const TextStyle(fontSize: 54),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        payload.emotionLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${t('confidence')}: ${payload.confidencePercent}%',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.primaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              payload.explanation,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
            if (payload.highlights.isNotEmpty) ...[
              const SizedBox(height: 14),
              Text(
                t('recommendationHighlights'),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              for (final item in payload.highlights)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    '${item.category}: ${item.title}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
            ],
            const SizedBox(height: 10),
            Text(
              t('resultShareCardFooter'),
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(color: AppColors.textTertiary),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 360.ms).slideY(begin: 0.04, end: 0);
  }
}

class _ShareActions extends StatefulWidget {
  const _ShareActions({required this.shareKey, required this.payload});

  final GlobalKey shareKey;
  final _SharePayload payload;

  @override
  State<_ShareActions> createState() => _ShareActionsState();
}

class _ShareActionsState extends State<_ShareActions> {
  bool _isSharing = false;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('shareResult'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            t('sharePreviewSubtitle'),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          PremiumButton(
            text: t('shareResultAsImage'),
            icon: Icons.ios_share_rounded,
            isLoading: _isSharing,
            onPressed: _isSharing ? null : _shareAsImage,
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _isSharing ? null : _shareAsText,
            icon: const Icon(Icons.notes_rounded),
            label: Text(t('shareResultAsText')),
          ),
          TextButton.icon(
            onPressed: _isSharing ? null : _copySummary,
            icon: const Icon(Icons.content_copy_rounded),
            label: Text(t('copySummary')),
          ),
        ],
      ),
    );
  }

  Future<void> _shareAsImage() async {
    setState(() => _isSharing = true);
    try {
      final file = await _captureShareCard();
      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'image/png', name: 'moodlens-result.png')],
        subject: t('resultShareCardTitle'),
        text: widget.payload.textSummary,
      );
      _showSnackBar(t('shareResultSuccess'), AppColors.success);
    } catch (_) {
      await _shareAsText(showSuccess: false);
      _showSnackBar(t('shareResultFailed'), AppColors.warning);
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  Future<void> _shareAsText({bool showSuccess = true}) async {
    await Share.share(
      widget.payload.textSummary,
      subject: t('resultShareCardTitle'),
    );
    if (showSuccess) {
      _showSnackBar(t('shareResultSuccess'), AppColors.success);
    }
  }

  Future<void> _copySummary() async {
    await Clipboard.setData(ClipboardData(text: widget.payload.textSummary));
    _showSnackBar(t('shareResultSuccess'), AppColors.success);
  }

  Future<File> _captureShareCard() async {
    await Future<void>.delayed(60.ms);
    final renderObject = widget.shareKey.currentContext?.findRenderObject();
    if (renderObject is! RenderRepaintBoundary) {
      throw StateError('Share card is not ready.');
    }

    final image = await renderObject.toImage(pixelRatio: 3);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) throw StateError('Share card export failed.');

    final bytes = Uint8List.view(byteData.buffer);
    final directory = await getTemporaryDirectory();
    final file = File(
      '${directory.path}/moodlens-result-${DateTime.now().millisecondsSinceEpoch}.png',
    );
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }

  void _showSnackBar(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: color,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: AppColors.info),
          const SizedBox(width: 10),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}

class _ResultLoading extends StatelessWidget {
  const _ResultLoading({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(child: AnimatedLoading(message: message));
  }
}

class _ResultEmpty extends StatelessWidget {
  const _ResultEmpty({required this.historyId});

  final String historyId;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GlassmorphismCard(
        margin: const EdgeInsets.all(20),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.search_off_rounded, size: 44),
            const SizedBox(height: 12),
            Text(
              t('resultFallbackEmptyTitle'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              _format('resultFallbackEmptyBody', {'historyId': historyId}),
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            PremiumButton(
              text: t('newAnalysis'),
              icon: Icons.refresh_rounded,
              onPressed: () => context.go('/analyze'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color});

  final String label;
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
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _SectionEyebrow extends StatelessWidget {
  const _SectionEyebrow({required this.text});

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

class _AtmosphereOrb extends StatelessWidget {
  const _AtmosphereOrb({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: 0.18),
          ),
        )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .scale(
          begin: const Offset(0.94, 0.94),
          end: const Offset(1.08, 1.08),
          duration: 2600.ms,
        );
  }
}

class _ResultData {
  const _ResultData({
    required this.historyId,
    required this.emotion,
    required this.confidence,
    required this.explanation,
    required this.warning,
    required this.modalityUsed,
    required this.modelUsed,
    required this.responseTimeMs,
    required this.faceDetected,
    required this.recommendations,
  });

  final String? historyId;
  final String emotion;
  final double confidence;
  final String explanation;
  final String? warning;
  final String modalityUsed;
  final String modelUsed;
  final int? responseTimeMs;
  final bool faceDetected;
  final RecommendationBundle recommendations;

  factory _ResultData.fromAnalysis(AnalysisResult result) {
    return _ResultData(
      historyId: result.historyId,
      emotion: result.emotion,
      confidence: result.confidence,
      explanation: result.explanation,
      warning: result.warning,
      modalityUsed: result.modalityUsed,
      modelUsed: result.modelUsed,
      responseTimeMs: result.responseTimeMs,
      faceDetected: result.faceDetected,
      recommendations: result.recommendations,
    );
  }

  factory _ResultData.fromDetail(ResultDetail detail) {
    return _ResultData(
      historyId: detail.historyId,
      emotion: detail.emotion,
      confidence: detail.confidence,
      explanation: detail.explanation,
      warning: detail.warning,
      modalityUsed: detail.modalityUsed,
      modelUsed: detail.modelUsed,
      responseTimeMs: detail.responseTimeMs,
      faceDetected: detail.faceDetected,
      recommendations: detail.recommendations,
    );
  }

  factory _ResultData.fromHistory(HistoryItem item) {
    return _ResultData(
      historyId: item.id,
      emotion: item.emotion,
      confidence: item.confidence,
      explanation: item.explanation ?? '',
      warning: null,
      modalityUsed: item.modalityUsed,
      modelUsed: item.modelUsed,
      responseTimeMs: item.responseTimeMs,
      faceDetected: item.faceDetected,
      recommendations: const RecommendationBundle(),
    );
  }
}

class _MetricItem {
  const _MetricItem(this.label, this.value);

  final String label;
  final String value;
}

class _RecommendationCategory {
  const _RecommendationCategory({
    required this.key,
    required this.label,
    required this.description,
    required this.icon,
    required this.items,
  });

  final String key;
  final String label;
  final String description;
  final IconData icon;
  final List<_RecommendationItem> items;
}

class _RecommendationItem {
  const _RecommendationItem({
    required this.type,
    required this.title,
    required this.icon,
    this.subtitle,
    this.reason,
    this.imageUrl,
    this.externalUrl,
    this.source,
    this.category,
  });

  final String type;
  final String title;
  final IconData icon;
  final String? subtitle;
  final String? reason;
  final String? imageUrl;
  final String? externalUrl;
  final String? source;
  final String? category;
}

class _SharePayload {
  const _SharePayload({
    required this.emotionEmoji,
    required this.emotionLabel,
    required this.confidencePercent,
    required this.explanation,
    required this.modalityUsed,
    required this.responseTimeText,
    required this.highlights,
    required this.generatedAt,
  });

  final String emotionEmoji;
  final String emotionLabel;
  final int confidencePercent;
  final String explanation;
  final String modalityUsed;
  final String responseTimeText;
  final List<_ShareHighlight> highlights;
  final DateTime generatedAt;

  String get formattedDate {
    return DateFormat('dd.MM.yyyy HH:mm').format(generatedAt.toLocal());
  }

  String get textSummary {
    final lines = [
      t('resultShareCardTitle'),
      '$emotionEmoji $emotionLabel - $confidencePercent%',
      '${t('explanation')}: $explanation',
      '${t('modalityUsed')}: $modalityUsed',
      '${t('responseTime')}: $responseTimeText',
      if (highlights.isNotEmpty) t('recommendationHighlights'),
      for (final highlight in highlights)
        '${highlight.category}: ${highlight.title}',
      t('resultShareCardFooter'),
    ];
    return lines.join('\n');
  }

  factory _SharePayload.fromData(_ResultData data) {
    final emotion = Emotion.fromKey(data.emotion);
    final highlights = <_ShareHighlight>[
      ...data.recommendations.music
          .take(1)
          .map(
            (item) => _ShareHighlight(category: t('music'), title: item.title),
          ),
      ...data.recommendations.movies
          .take(1)
          .map(
            (item) => _ShareHighlight(category: t('movies'), title: item.title),
          ),
      ...data.recommendations.books
          .take(1)
          .map(
            (item) => _ShareHighlight(category: t('books'), title: item.title),
          ),
      ...data.recommendations.advice
          .take(1)
          .map(
            (item) => _ShareHighlight(category: t('advice'), title: item.title),
          ),
    ].take(2).toList();

    return _SharePayload(
      emotionEmoji: emotion.emoji,
      emotionLabel: emotion.label(AppLocalizations.currentLocale),
      confidencePercent: (data.confidence.clamp(0, 1) * 100).round(),
      explanation: data.explanation.isEmpty
          ? t('resultNoExplanation')
          : data.explanation,
      modalityUsed: _modeLabel(data.modalityUsed),
      responseTimeText: data.responseTimeMs == null
          ? '-'
          : '${data.responseTimeMs} ${t('milliseconds')}',
      highlights: highlights,
      generatedAt: DateTime.now(),
    );
  }
}

class _ShareHighlight {
  const _ShareHighlight({required this.category, required this.title});

  final String category;
  final String title;
}

List<_RecommendationCategory> _recommendationCategories(
  RecommendationBundle bundle,
) {
  return [
    _RecommendationCategory(
      key: 'music',
      label: t('music'),
      description: t('resultMusicDescription'),
      icon: Icons.music_note_rounded,
      items: bundle.music.map((item) {
        return _RecommendationItem(
          type: 'music',
          title: item.title,
          subtitle: item.artist,
          reason: item.reason,
          imageUrl: item.coverUrl ?? item.imageUrl,
          externalUrl: item.externalUrl ?? item.url,
          source: item.source,
          category: item.category ?? item.type,
          icon: Icons.music_note_rounded,
        );
      }).toList(),
    ),
    _RecommendationCategory(
      key: 'movie',
      label: t('movies'),
      description: t('resultMovieDescription'),
      icon: Icons.movie_creation_outlined,
      items: bundle.movies.map((item) {
        return _RecommendationItem(
          type: 'movie',
          title: item.title,
          subtitle: [
            item.year,
            item.rating?.toStringAsFixed(1),
          ].whereType<String>().where((value) => value.isNotEmpty).join(' - '),
          reason: item.reason ?? item.overview ?? item.description,
          imageUrl: item.posterUrl ?? item.imageUrl,
          externalUrl: item.externalUrl ?? item.url,
          source: item.source,
          category: item.category ?? item.type,
          icon: Icons.movie_creation_outlined,
        );
      }).toList(),
    ),
    _RecommendationCategory(
      key: 'book',
      label: t('books'),
      description: t('resultBookDescription'),
      icon: Icons.menu_book_rounded,
      items: bundle.books.map((item) {
        return _RecommendationItem(
          type: 'book',
          title: item.title,
          subtitle: item.author,
          reason: item.reason ?? item.description,
          imageUrl: item.coverUrl ?? item.imageUrl,
          externalUrl: item.externalUrl ?? item.url,
          source: item.source,
          category: item.category ?? item.type,
          icon: Icons.menu_book_rounded,
        );
      }).toList(),
    ),
    _RecommendationCategory(
      key: 'advice',
      label: t('advice'),
      description: t('resultAdviceDescription'),
      icon: Icons.lightbulb_outline_rounded,
      items: bundle.advice.map((item) {
        return _RecommendationItem(
          type: 'advice',
          title: item.title,
          subtitle: item.icon,
          reason: item.reason ?? item.description,
          externalUrl: item.externalUrl ?? item.url,
          source: item.source,
          category: item.category ?? item.type,
          icon: Icons.lightbulb_outline_rounded,
        );
      }).toList(),
    ),
  ];
}

class _EmptyRecommendation extends StatelessWidget {
  const _EmptyRecommendation({required this.category, required this.accent});

  final String category;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.34),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.52)),
      ),
      child: Column(
        children: [
          Icon(Icons.auto_awesome_rounded, color: accent),
          const SizedBox(height: 8),
          Text(
            _format('resultRecommendationEmpty', {'category': category}),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

String _modeLabel(String mode) {
  return switch (mode) {
    'multimodal' => t('resultModeMultimodal'),
    'image' => t('resultModeImage'),
    'text' => t('resultModeText'),
    _ => mode,
  };
}

String _emotionTone(Emotion emotion) {
  return switch (emotion) {
    Emotion.happy => t('resultToneHappy'),
    Emotion.sad => t('resultToneSad'),
    Emotion.angry => t('resultToneAngry'),
    Emotion.anxious => t('resultToneAnxious'),
    Emotion.excited => t('resultToneExcited'),
    Emotion.calm => t('resultToneCalm'),
    Emotion.tired => t('resultToneTired'),
    Emotion.stressed => t('resultToneStressed'),
    Emotion.nostalgic => t('resultToneNostalgic'),
    Emotion.motivated => t('resultToneMotivated'),
    Emotion.hopeful => t('resultToneHopeful'),
    Emotion.overwhelmed => t('resultToneOverwhelmed'),
  };
}

String _coachPrompt(Emotion emotion) {
  return switch (emotion) {
    Emotion.happy => t('resultCoachHappy'),
    Emotion.sad => t('resultCoachSad'),
    Emotion.angry => t('resultCoachAngry'),
    Emotion.anxious => t('resultCoachAnxious'),
    Emotion.excited => t('resultCoachExcited'),
    Emotion.calm => t('resultCoachCalm'),
    Emotion.tired => t('resultCoachTired'),
    Emotion.stressed => t('resultCoachStressed'),
    Emotion.nostalgic => t('resultCoachNostalgic'),
    Emotion.motivated => t('resultCoachMotivated'),
    Emotion.hopeful => t('resultCoachHopeful'),
    Emotion.overwhelmed => t('resultCoachOverwhelmed'),
  };
}

String _format(String key, Map<String, Object> values) {
  var text = t(key);
  for (final entry in values.entries) {
    text = text.replaceAll('{${entry.key}}', entry.value.toString());
  }
  return text;
}
