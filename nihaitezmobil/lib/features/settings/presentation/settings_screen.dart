/// Settings screen for persisted language, theme, and demo diagnostics.
library;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import 'providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t('settings'))),
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
            children: [
              SectionHeader(
                title: t('settings'),
                subtitle: t('settingsSubtitle'),
              ),
              const SizedBox(height: 14),
              GlassmorphismCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SectionHeader(title: t('settingsAppearance')),
                    const SizedBox(height: 16),
                    Text(
                      t('theme'),
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: 8),
                    SegmentedButton<ThemeMode>(
                      showSelectedIcon: false,
                      selected: {themeMode},
                      onSelectionChanged: (selection) {
                        ref
                            .read(themeModeProvider.notifier)
                            .setThemeMode(selection.first);
                      },
                      segments: [
                        ButtonSegment(
                          value: ThemeMode.system,
                          icon: const Icon(Icons.brightness_auto),
                          label: Text(t('themeSystem')),
                        ),
                        ButtonSegment(
                          value: ThemeMode.light,
                          icon: const Icon(Icons.light_mode),
                          label: Text(t('themeLight')),
                        ),
                        ButtonSegment(
                          value: ThemeMode.dark,
                          icon: const Icon(Icons.dark_mode),
                          label: Text(t('themeDark')),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Text(
                      t('language'),
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      showSelectedIcon: false,
                      selected: {locale.languageCode},
                      onSelectionChanged: (selection) {
                        ref
                            .read(localeProvider.notifier)
                            .setLocale(Locale(selection.first));
                      },
                      segments: [
                        ButtonSegment(
                          value: 'tr',
                          icon: const Icon(Icons.translate),
                          label: Text(t('languageTurkish')),
                        ),
                        ButtonSegment(
                          value: 'en',
                          icon: const Icon(Icons.language),
                          label: Text(t('languageEnglish')),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              GlassmorphismCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SectionHeader(
                      title: t('settingsDebug'),
                      subtitle: t('settingsDebugSubtitle'),
                    ),
                    const SizedBox(height: 12),
                    _InfoRow(
                      label: t('appVersion'),
                      value: AppConstants.appVersion,
                    ),
                    _InfoRow(
                      label: t('backendBaseUrl'),
                      value: ApiConstants.currentBaseUrl,
                    ),
                    _InfoRow(
                      label: t('backendMode'),
                      value: ApiConstants.hasCustomBaseUrl
                          ? t('backendModeCustom')
                          : t('backendModeAuto'),
                    ),
                    _InfoRow(label: t('platform'), value: _platformLabel()),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              GlassmorphismCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SectionHeader(title: t('settingsAccount')),
                    const SizedBox(height: 14),
                    PremiumButton(
                      text: t('profileTitle'),
                      icon: Icons.person,
                      isSecondary: true,
                      onPressed: () => context.go('/profile'),
                    ),
                    if (authState.user?.isAdmin == true) ...[
                      const SizedBox(height: 12),
                      PremiumButton(
                        text: t('metrics'),
                        icon: Icons.bar_chart,
                        onPressed: () => context.push('/metrics'),
                      ),
                    ],
                    const SizedBox(height: 12),
                    PremiumButton(
                      text: authState.isAuthenticated
                          ? t('logout')
                          : t('login'),
                      icon: authState.isAuthenticated
                          ? Icons.logout
                          : Icons.login,
                      isSecondary: authState.isAuthenticated,
                      onPressed: () async {
                        if (authState.isAuthenticated) {
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) context.go('/');
                          return;
                        }
                        context.go(
                          '/login?from=${Uri.encodeComponent('/settings')}',
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _platformLabel() {
    if (kIsWeb) return t('platformWeb');

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => t('platformAndroid'),
      TargetPlatform.iOS => t('platformIos'),
      TargetPlatform.macOS ||
      TargetPlatform.windows ||
      TargetPlatform.linux => t('platformDesktop'),
      TargetPlatform.fuchsia => t('platformDesktop'),
    };
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
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
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
