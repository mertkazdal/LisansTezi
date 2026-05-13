/// Three-step onboarding that stores first-launch completion.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../shared/providers/storage_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  List<_OnboardingStep> get _steps => [
    _OnboardingStep(
      icon: Icons.auto_awesome,
      kickerKey: 'onboarding1Kicker',
      titleKey: 'onboarding1Title',
      descriptionKey: 'onboarding1Desc',
    ),
    _OnboardingStep(
      icon: Icons.library_music,
      kickerKey: 'onboarding2Kicker',
      titleKey: 'onboarding2Title',
      descriptionKey: 'onboarding2Desc',
    ),
    _OnboardingStep(
      icon: Icons.insights,
      kickerKey: 'onboarding3Kicker',
      titleKey: 'onboarding3Title',
      descriptionKey: 'onboarding3Desc',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finishOnboarding() async {
    await ref.read(preferencesServiceProvider).setOnboardingCompleted();
    if (!mounted) return;

    final authState = ref.read(authProvider);
    context.go(authState.isAuthenticated ? '/' : '/login');
  }

  Future<void> _nextPage() async {
    if (_currentIndex == _steps.length - 1) {
      await _finishOnboarding();
      return;
    }

    await _pageController.nextPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLastPage = _currentIndex == _steps.length - 1;

    return Scaffold(
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _finishOnboarding,
                    child: Text(t('skip')),
                  ),
                ),
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: _steps.length,
                    onPageChanged: (index) {
                      setState(() => _currentIndex = index);
                    },
                    itemBuilder: (context, index) {
                      return _OnboardingStepView(step: _steps[index]);
                    },
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _steps.length,
                    (index) => AnimatedContainer(
                      duration: const Duration(milliseconds: 240),
                      width: _currentIndex == index ? 28 : 8,
                      height: 8,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: _currentIndex == index
                            ? AppColors.primary
                            : AppColors.borderLight,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                PremiumButton(
                  text: isLastPage ? t('finish') : t('next'),
                  icon: isLastPage ? Icons.rocket_launch : Icons.arrow_forward,
                  onPressed: _nextPage,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingStep {
  const _OnboardingStep({
    required this.icon,
    required this.kickerKey,
    required this.titleKey,
    required this.descriptionKey,
  });

  final IconData icon;
  final String kickerKey;
  final String titleKey;
  final String descriptionKey;
}

class _OnboardingStepView extends StatelessWidget {
  const _OnboardingStepView({required this.step});

  final _OnboardingStep step;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: GlassmorphismCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 82,
              height: 82,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.28),
                    blurRadius: 32,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: Icon(step.icon, color: Colors.white, size: 38),
            ).animate().scale(duration: 360.ms).fadeIn(),
            const SizedBox(height: 24),
            Text(
              t(step.kickerKey),
              textAlign: TextAlign.center,
              style: textTheme.labelLarge?.copyWith(color: AppColors.primary),
            ),
            const SizedBox(height: 8),
            Text(
              t(step.titleKey),
              textAlign: TextAlign.center,
              style: textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              t(step.descriptionKey),
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
