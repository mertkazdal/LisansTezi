/// Splash screen that restores auth and deterministically routes first launch.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/animated_loading.dart';
import '../../../shared/providers/storage_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _bootstrapped = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    if (_bootstrapped) return;
    _bootstrapped = true;

    await Future<void>.delayed(const Duration(milliseconds: 700));
    await ref.read(authProvider.notifier).restoreSession();

    if (!mounted) return;

    final onboardingCompleted = ref
        .read(preferencesServiceProvider)
        .isOnboardingCompleted();
    final authState = ref.read(authProvider);

    if (!onboardingCompleted) {
      context.go('/onboarding');
      return;
    }

    context.go(authState.isAuthenticated ? '/' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedGradientBackground(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.psychology,
                color: AppColors.primary,
                size: 76,
              ).animate().scale(duration: 500.ms).fadeIn(),
              const SizedBox(height: 18),
              Text(
                t('appName'),
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(height: 12),
              AnimatedLoading(message: t('splashCheckingSession')),
            ],
          ),
        ),
      ),
    );
  }
}
