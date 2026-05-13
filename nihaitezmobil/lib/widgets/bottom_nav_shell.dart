/// Dynamic mobile navigation shell mirroring the web Navbar bottom links.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/constants/app_constants.dart';
import '../core/i18n/app_localizations.dart';
import '../core/theme/app_colors.dart';
import '../features/analyze/presentation/providers/analyze_provider.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/settings/presentation/providers/settings_provider.dart';
import '../shared/providers/storage_provider.dart';

class BottomNavShell extends ConsumerWidget {
  const BottomNavShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeModeProvider);
    final analyzeState = ref.watch(analyzeProvider);
    final int guestRemaining =
        analyzeState.guestRemainingAnalyses ??
        ref.watch(guestRemainingAnalysesProvider);
    final isAuthenticated = authState.isAuthenticated;
    final isAdmin = authState.user?.isAdmin == true;
    final tabs = _buildTabs(isAuthenticated: isAuthenticated, isAdmin: isAdmin);

    return Scaffold(
      body: child,
      bottomNavigationBar: SafeArea(
        top: false,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Theme.of(
              context,
            ).colorScheme.surface.withValues(alpha: 0.95),
            border: Border(
              top: BorderSide(color: AppColors.border.withValues(alpha: 0.55)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 22,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ShellStatusStrip(
                isAuthenticated: isAuthenticated,
                username: authState.user?.username,
                guestRemaining: guestRemaining,
                themeMode: themeMode,
                onToggleTheme: () => _toggleTheme(ref, themeMode),
              ),
              BottomNavigationBar(
                type: BottomNavigationBarType.fixed,
                currentIndex: _calculateSelectedIndex(context, tabs),
                onTap: (index) => context.go(tabs[index].path),
                items: [
                  for (final tab in tabs)
                    BottomNavigationBarItem(
                      icon: Icon(tab.icon),
                      label: tab.label,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<_NavTab> _buildTabs({
    required bool isAuthenticated,
    required bool isAdmin,
  }) {
    return [
      _NavTab(path: '/', label: t('navHomeShort'), icon: Icons.home_rounded),
      _NavTab(path: '/analyze', label: t('navAnalyze'), icon: Icons.psychology),
      if (isAdmin)
        _NavTab(
          path: '/metrics',
          label: t('navMetricsShort'),
          icon: Icons.analytics,
        )
      else if (isAuthenticated)
        _NavTab(path: '/history', label: t('navHistory'), icon: Icons.history)
      else
        _NavTab(
          path: '/login?from=${Uri.encodeComponent('/analyze')}',
          label: t('login'),
          icon: Icons.login,
        ),
      if (isAuthenticated)
        _NavTab(path: '/profile', label: t('navProfile'), icon: Icons.person)
      else
        _NavTab(
          path: '/register?from=${Uri.encodeComponent('/analyze')}',
          label: t('register'),
          icon: Icons.person_add_alt_1,
        ),
    ];
  }

  int _calculateSelectedIndex(BuildContext context, List<_NavTab> tabs) {
    final path = GoRouterState.of(context).uri.path;
    final normalizedTabs = tabs
        .map((tab) => Uri.parse(tab.path).path)
        .toList(growable: false);
    for (var index = 0; index < normalizedTabs.length; index++) {
      final tabPath = normalizedTabs[index];
      if (tabPath == '/' && path == '/') return index;
      if (tabPath != '/' && path.startsWith(tabPath)) return index;
    }
    return 0;
  }

  Future<void> _toggleTheme(WidgetRef ref, ThemeMode current) {
    final next = current == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    return ref.read(themeModeProvider.notifier).setThemeMode(next);
  }
}

class _ShellStatusStrip extends StatelessWidget {
  const _ShellStatusStrip({
    required this.isAuthenticated,
    required this.username,
    required this.guestRemaining,
    required this.themeMode,
    required this.onToggleTheme,
  });

  final bool isAuthenticated;
  final String? username;
  final int guestRemaining;
  final ThemeMode themeMode;
  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final progress = isAuthenticated
        ? 1.0
        : (guestRemaining / AppConstants.guestAnalysisLimit)
              .clamp(0, 1)
              .toDouble();

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 2),
      child: Row(
        children: [
          Expanded(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: isAuthenticated
                    ? AppColors.primary.withValues(alpha: 0.10)
                    : AppColors.warning.withValues(alpha: 0.11),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: isAuthenticated
                      ? AppColors.primary.withValues(alpha: 0.22)
                      : AppColors.warning.withValues(alpha: 0.24),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Icon(
                      isAuthenticated
                          ? Icons.verified_user_outlined
                          : Icons.hourglass_bottom_rounded,
                      color: isAuthenticated
                          ? AppColors.primaryLight
                          : AppColors.warning,
                      size: 17,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        isAuthenticated
                            ? t('shellAccountMode').replaceAll(
                                '{username}',
                                username ?? t('profileTitle'),
                              )
                            : t(
                                'shellGuestQuota',
                              ).replaceAll('{remaining}', '$guestRemaining'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 52,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 4,
                          color: isAuthenticated
                              ? AppColors.primary
                              : AppColors.warning,
                          backgroundColor: Colors.white.withValues(alpha: 0.12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filledTonal(
            tooltip: t('themeQuickToggle'),
            onPressed: onToggleTheme,
            icon: Icon(
              themeMode == ThemeMode.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
            ),
          ),
        ],
      ),
    );
  }
}

class _NavTab {
  const _NavTab({required this.path, required this.label, required this.icon});

  final String path;
  final String label;
  final IconData icon;
}
