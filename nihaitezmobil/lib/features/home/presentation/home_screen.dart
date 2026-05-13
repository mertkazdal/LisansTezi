/// Mobile Home/Dashboard screen aligned with the web HomePage product canon.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/constants/emotion_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/animated_section.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../shared/providers/storage_provider.dart';
import '../../analyze/presentation/providers/analyze_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final analyzeState = ref.watch(analyzeProvider);
    final int guestRemaining =
        analyzeState.guestRemainingAnalyses ??
        ref.watch(guestRemainingAnalysesProvider);
    final latestResult = analyzeState.result;
    final isAuthenticated = authState.isAuthenticated;
    final isAdmin = authState.user?.isAdmin == true;
    final secondaryCta = _secondaryCta(
      isAuthenticated: isAuthenticated,
      isAdmin: isAdmin,
    );

    return Scaffold(
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
            children: [
              AnimatedSection(
                child: _HeroPanel(
                  isAuthenticated: isAuthenticated,
                  username: authState.user?.username,
                  guestRemaining: guestRemaining,
                  secondaryCta: secondaryCta,
                  onAnalyze: () => context.go('/analyze'),
                  onSecondary: () => context.go(secondaryCta.path),
                ),
              ),
              const SizedBox(height: 14),
              AnimatedSection(
                delay: 80.ms,
                child: _GuestOrAccountProgress(
                  isAuthenticated: isAuthenticated,
                  guestRemaining: guestRemaining,
                ),
              ),
              const SizedBox(height: 14),
              AnimatedSection(delay: 140.ms, child: const _EmotionRadar()),
              const SizedBox(height: 14),
              AnimatedSection(
                delay: 200.ms,
                child: _ExperienceCards(isAuthenticated: isAuthenticated),
              ),
              const SizedBox(height: 14),
              AnimatedSection(
                delay: 260.ms,
                child: latestResult == null
                    ? _EmptyLatestResult(
                        onAnalyze: () => context.go('/analyze'),
                      )
                    : _LatestResultCard(
                        emotion: latestResult.emotion,
                        confidence: latestResult.confidence,
                        explanation: latestResult.explanation,
                        historyId: latestResult.historyId,
                      ),
              ),
              const SizedBox(height: 14),
              AnimatedSection(delay: 320.ms, child: const _FlowSteps()),
              const SizedBox(height: 14),
              PremiumButton(
                text: t('actionsGoToStudio'),
                icon: Icons.auto_awesome,
                onPressed: () => context.go('/analyze'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  _HomeCta _secondaryCta({
    required bool isAuthenticated,
    required bool isAdmin,
  }) {
    if (isAdmin) {
      return _HomeCta(path: '/metrics', label: t('actionsViewMetrics'));
    }
    if (isAuthenticated) {
      return _HomeCta(path: '/profile', label: t('navProfile'));
    }
    return _HomeCta(
      path: '/register?from=${Uri.encodeComponent('/analyze')}',
      label: t('actionsCreateAccount'),
    );
  }
}

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({
    required this.isAuthenticated,
    required this.username,
    required this.guestRemaining,
    required this.secondaryCta,
    required this.onAnalyze,
    required this.onSecondary,
  });

  final bool isAuthenticated;
  final String? username;
  final int guestRemaining;
  final _HomeCta secondaryCta;
  final VoidCallback onAnalyze;
  final VoidCallback onSecondary;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                    width: 52,
                    height: 52,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.glowGradient,
                    ),
                    child: const Icon(Icons.psychology, color: Colors.white),
                  )
                  .animate(
                    onPlay: (controller) => controller.repeat(reverse: true),
                  )
                  .scaleXY(begin: 0.96, end: 1.04, duration: 1600.ms),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('homeHeroEyebrow'),
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      t('appNameFull'),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            t('homeHeroTitle'),
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            t('homeHeroDescription'),
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          _ModePill(
            icon: isAuthenticated
                ? Icons.verified_user_outlined
                : Icons.hourglass_bottom_rounded,
            title: isAuthenticated ? t('homeAccountMode') : t('homeGuestMode'),
            body: isAuthenticated
                ? t(
                    'homeAccountModeBody',
                  ).replaceAll('{username}', username ?? t('profileTitle'))
                : t('homeGuestModeBody')
                      .replaceAll('{remaining}', '$guestRemaining')
                      .replaceAll(
                        '{limit}',
                        '${AppConstants.guestAnalysisLimit}',
                      ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: PremiumButton(
                  text: t('actionsStartAnalysis'),
                  icon: Icons.auto_awesome,
                  onPressed: onAnalyze,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: PremiumButton(
                  text: secondaryCta.label,
                  icon: Icons.arrow_forward,
                  isSecondary: true,
                  onPressed: onSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GuestOrAccountProgress extends StatelessWidget {
  const _GuestOrAccountProgress({
    required this.isAuthenticated,
    required this.guestRemaining,
  });

  final bool isAuthenticated;
  final int guestRemaining;

  @override
  Widget build(BuildContext context) {
    final guestLimit = AppConstants.guestAnalysisLimit;
    final progress = isAuthenticated
        ? 1.0
        : (guestRemaining / guestLimit).clamp(0, 1).toDouble();

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: _StatPill(
                  label: isAuthenticated
                      ? t('homeAccountMode')
                      : t('homeGuestQuota'),
                  value: isAuthenticated
                      ? t('commonUnlimited')
                      : '$guestRemaining',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatPill(
                  label: t('homeFreeTrial'),
                  value: t(
                    'commonCountAnalyses',
                  ).replaceAll('{count}', '$guestLimit'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatPill(
                  label: t('homeEmotionModel'),
                  value: '${Emotion.values.length}',
                ),
              ),
            ],
          ),
          if (!isAuthenticated) ...[
            const SizedBox(height: 14),
            Text(
              t('homeGuestOpenTitle').replaceAll('{limit}', '$guestLimit'),
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: AppColors.warning,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              t('homeGuestOpenDescription'),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                color: AppColors.warning,
                backgroundColor: Colors.white.withValues(alpha: 0.10),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              t('homeRemaining').replaceAll('{count}', '$guestRemaining'),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmotionRadar extends StatelessWidget {
  const _EmotionRadar();

  @override
  Widget build(BuildContext context) {
    final emotions = Emotion.values.take(8).toList();

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('homeEmotionField'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var index = 0; index < emotions.length; index++)
                _EmotionRadarChip(emotion: emotions[index], index: index),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmotionRadarChip extends StatelessWidget {
  const _EmotionRadarChip({required this.emotion, required this.index});

  final Emotion emotion;
  final int index;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
          decoration: BoxDecoration(
            color: emotion.color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: emotion.color.withValues(alpha: 0.32)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(emotion.emoji),
                const SizedBox(width: 6),
                Text(
                  emotion.label(AppLocalizations.currentLocale),
                  style: Theme.of(context).textTheme.labelMedium,
                ),
              ],
            ),
          ),
        )
        .animate(delay: (index * 55).ms)
        .fadeIn(duration: 280.ms)
        .slideX(begin: 0.08, end: 0);
  }
}

class _ExperienceCards extends StatelessWidget {
  const _ExperienceCards({required this.isAuthenticated});

  final bool isAuthenticated;

  @override
  Widget build(BuildContext context) {
    final items = [
      _ExperienceItem(
        marker: '01',
        title: t('homeFeatureFlexibleTitle'),
        body: t('homeFeatureFlexibleBody'),
        icon: Icons.input,
        color: AppColors.primary,
      ),
      _ExperienceItem(
        marker: '02',
        title: t('homeFeatureEmotionTitle'),
        body: t('homeFeatureEmotionBody'),
        icon: Icons.favorite_border,
        color: AppColors.warning,
      ),
      _ExperienceItem(
        marker: '03',
        title: t('homeFeatureRecommendationTitle'),
        body: t('homeFeatureRecommendationBody'),
        icon: Icons.recommend_outlined,
        color: AppColors.success,
      ),
    ];

    return Column(
      children: [
        for (var index = 0; index < items.length; index++) ...[
          _ExperienceCard(item: items[index])
              .animate(delay: (index * 70).ms)
              .fadeIn(duration: 320.ms)
              .slideY(begin: 0.04, end: 0),
          if (index != items.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _LatestResultCard extends StatelessWidget {
  const _LatestResultCard({
    required this.emotion,
    required this.confidence,
    required this.explanation,
    required this.historyId,
  });

  final String emotion;
  final double confidence;
  final String explanation;
  final String? historyId;

  @override
  Widget build(BuildContext context) {
    final percent = (confidence * 100).clamp(0, 100).round();
    final emotionMeta = Emotion.fromKey(emotion);

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(emotionMeta.emoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  emotionMeta.label(AppLocalizations.currentLocale),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              Text(
                '$percent%',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(explanation, maxLines: 3, overflow: TextOverflow.ellipsis),
          if (historyId != null && historyId!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => context.go('/result/$historyId'),
                icon: const Icon(Icons.arrow_forward),
                label: Text(t('homeViewResult')),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmptyLatestResult extends StatelessWidget {
  const _EmptyLatestResult({required this.onAnalyze});

  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.insights, color: AppColors.info),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              t('homeNoLatestResult'),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          IconButton(
            onPressed: onAnalyze,
            icon: const Icon(Icons.arrow_forward),
            tooltip: t('homeQuickAnalyze'),
          ),
        ],
      ),
    );
  }
}

class _FlowSteps extends StatelessWidget {
  const _FlowSteps();

  @override
  Widget build(BuildContext context) {
    final steps = [
      (t('homeFlowTextTitle'), t('homeFlowTextBody'), Icons.edit_note),
      (t('homeFlowImageTitle'), t('homeFlowImageBody'), Icons.photo_camera),
      (t('homeFlowAiTitle'), t('homeFlowAiBody'), Icons.auto_awesome),
      (t('homeFlowResultTitle'), t('homeFlowResultBody'), Icons.recommend),
    ];

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('homeFlowTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          for (var index = 0; index < steps.length; index++) ...[
            _FlowStep(
              number: index + 1,
              title: steps[index].$1,
              body: steps[index].$2,
              icon: steps[index].$3,
            ),
            if (index != steps.length - 1) const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _ModePill extends StatelessWidget {
  const _ModePill({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.54),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.warning),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 3),
                  Text(
                    body,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.48),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.textTertiary,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _ExperienceCard extends StatelessWidget {
  const _ExperienceCard({required this.item});

  final _ExperienceItem item;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: item.color.withValues(alpha: 0.16),
            child: Icon(item.icon, color: item.color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.marker,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(item.title, style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(
                  item.body,
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

class _FlowStep extends StatelessWidget {
  const _FlowStep({
    required this.number,
    required this.title,
    required this.body,
    required this.icon,
  });

  final int number;
  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 17,
          backgroundColor: AppColors.primary.withValues(alpha: 0.18),
          child: Icon(icon, size: 17, color: AppColors.primaryLight),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$number. $title',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: 2),
              Text(
                body,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HomeCta {
  const _HomeCta({required this.path, required this.label});

  final String path;
  final String label;
}

class _ExperienceItem {
  const _ExperienceItem({
    required this.marker,
    required this.title,
    required this.body,
    required this.icon,
    required this.color,
  });

  final String marker;
  final String title;
  final String body;
  final IconData icon;
  final Color color;
}
