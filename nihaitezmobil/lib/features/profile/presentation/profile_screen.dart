/// Web-canonical profile page with account, saved items, and data controls.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/constants/emotion_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/animated_loading.dart';
import '../../../core/widgets/error_state.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../../shared/providers/storage_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../../result/domain/saved_recommendation.dart';
import '../../result/presentation/providers/saved_recommendations_provider.dart';
import '../domain/profile_models.dart';
import 'providers/profile_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isDeleting = false;
  bool _isLoggingOut = false;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final guestRemaining = ref.watch(guestRemainingAnalysesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(t('profileTitle')),
        actions: [
          if (authState.isAuthenticated)
            IconButton(
              tooltip: t('refresh'),
              onPressed: _refreshProfile,
              icon: const Icon(Icons.refresh_rounded),
            ),
          IconButton(
            tooltip: t('settings'),
            onPressed: () => context.push('/settings'),
            icon: const Icon(Icons.settings_rounded),
          ),
        ],
      ),
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: authState.isLoading || authState.status.name == 'unknown'
              ? Center(child: AnimatedLoading(message: t('loading')))
              : !authState.isAuthenticated
              ? _GuestProfile(
                  remaining: guestRemaining,
                  onLogin: () => context.go(
                    '/login?from=${Uri.encodeComponent('/profile')}',
                  ),
                  onRegister: () => context.go(
                    '/register?from=${Uri.encodeComponent('/profile')}',
                  ),
                  onAnalyze: () => context.go('/analyze'),
                )
              : ref
                    .watch(profileProvider)
                    .when(
                      data: (profile) => _AuthenticatedProfile(
                        profile: profile,
                        isDeleting: _isDeleting,
                        isLoggingOut: _isLoggingOut,
                        currentLocale: ref.watch(localeProvider).languageCode,
                        savedRecommendations: ref.watch(
                          savedRecommendationsProvider,
                        ),
                        onRefresh: _refreshProfile,
                        onSetLocale: (locale) {
                          ref
                              .read(localeProvider.notifier)
                              .setLocale(Locale(locale));
                        },
                        onRemoveSaved: (id) {
                          ref
                              .read(savedRecommendationsProvider.notifier)
                              .remove(id);
                        },
                        onClearSaved: () {
                          ref
                              .read(savedRecommendationsProvider.notifier)
                              .clearAll();
                        },
                        onOpenSavedExternal: _openExternal,
                        onOpenSavedSource: (historyId) {
                          context.push('/result/$historyId');
                        },
                        onMetrics: () => context.push('/metrics'),
                        onSettings: () => context.push('/settings'),
                        onLogout: _logout,
                        onDeleteAccount: () => _confirmDeleteAccount(profile),
                      ),
                      loading: () =>
                          Center(child: AnimatedLoading(message: t('loading'))),
                      error: (_, _) => _ProfileError(onRetry: _refreshProfile),
                    ),
        ),
      ),
    );
  }

  Future<void> _refreshProfile() async {
    ref.invalidate(profileProvider);
    try {
      await ref.read(profileProvider.future);
    } catch (_) {
      // The AsyncValue branch renders the localized error panel.
    }
  }

  Future<void> _logout() async {
    if (_isLoggingOut) return;
    setState(() => _isLoggingOut = true);
    try {
      await ref.read(authProvider.notifier).logout();
      if (!mounted) return;
      _showSnack(t('profileLogoutSuccess'), AppColors.success);
      context.go('/');
    } catch (_) {
      if (mounted) _showSnack(t('profileLogoutError'), AppColors.error);
    } finally {
      if (mounted) setState(() => _isLoggingOut = false);
    }
  }

  Future<void> _openExternal(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      _showSnack(t('profileSavedExternalFailed'), AppColors.error);
      return;
    }

    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      _showSnack(t('profileSavedExternalFailed'), AppColors.error);
    }
  }

  Future<void> _confirmDeleteAccount(ProfileModel profile) async {
    final didConfirm = await showDialog<bool>(
      context: context,
      builder: (context) => _DeleteAccountDialog(profile: profile),
    );

    if (didConfirm != true) return;

    setState(() => _isDeleting = true);
    try {
      final result = await ref
          .read(profileRepositoryProvider)
          .deleteAccount(confirmationText: profile.deleteConfirmationText);
      await ref.read(authProvider.notifier).logout();
      if (!mounted) return;
      _showSnack(
        t('profileDeleteSuccessDetail')
            .replaceAll('{analyses}', '${result.deletedAnalyses}')
            .replaceAll(
              '{recommendations}',
              '${result.deletedRecommendations}',
            ),
        AppColors.success,
      );
      context.go('/');
    } catch (_) {
      if (!mounted) return;
      _showSnack(t('accountDeleteError'), AppColors.error);
    } finally {
      if (mounted) setState(() => _isDeleting = false);
    }
  }

  void _showSnack(String message, Color color) {
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

class _AuthenticatedProfile extends StatelessWidget {
  const _AuthenticatedProfile({
    required this.profile,
    required this.isDeleting,
    required this.isLoggingOut,
    required this.currentLocale,
    required this.savedRecommendations,
    required this.onRefresh,
    required this.onSetLocale,
    required this.onRemoveSaved,
    required this.onClearSaved,
    required this.onOpenSavedExternal,
    required this.onOpenSavedSource,
    required this.onMetrics,
    required this.onSettings,
    required this.onLogout,
    required this.onDeleteAccount,
  });

  final ProfileModel profile;
  final bool isDeleting;
  final bool isLoggingOut;
  final String currentLocale;
  final List<SavedRecommendation> savedRecommendations;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onSetLocale;
  final ValueChanged<String> onRemoveSaved;
  final VoidCallback onClearSaved;
  final ValueChanged<String> onOpenSavedExternal;
  final ValueChanged<String> onOpenSavedSource;
  final VoidCallback onMetrics;
  final VoidCallback onSettings;
  final VoidCallback onLogout;
  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    final locale = currentLocale == 'en' ? 'en' : 'tr';

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
        children: [
          _ProfileHero(profile: profile, locale: locale),
          const SizedBox(height: 14),
          _ProfileStatsGrid(
            profile: profile,
            locale: locale,
            savedCount: savedRecommendations.length,
          ),
          const SizedBox(height: 14),
          _LanguageAndDataPanel(
            currentLocale: currentLocale,
            onSetLocale: onSetLocale,
            onSettings: onSettings,
          ),
          const SizedBox(height: 14),
          _SavedRecommendationsPanel(
            items: savedRecommendations,
            onRemove: onRemoveSaved,
            onClearAll: onClearSaved,
            onOpenExternal: onOpenSavedExternal,
            onOpenSourceResult: onOpenSavedSource,
          ),
          if (profile.isAdmin) ...[
            const SizedBox(height: 14),
            _AdminShortcutPanel(onMetrics: onMetrics),
          ],
          const SizedBox(height: 14),
          _AccountActionsPanel(
            isDeleting: isDeleting,
            isLoggingOut: isLoggingOut,
            canDeleteAccount: profile.canDeleteAccount,
            onSettings: onSettings,
            onLogout: onLogout,
            onDeleteAccount: onDeleteAccount,
          ),
        ],
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.profile, required this.locale});

  final ProfileModel profile;
  final String locale;

  @override
  Widget build(BuildContext context) {
    final emotion = Emotion.fromKey(profile.mostFrequentEmotion ?? 'calm');
    final accent = emotion.color;
    final initial = profile.username.trim().isEmpty
        ? 'M'
        : profile.username.trim().characters.first.toUpperCase();

    return GlassmorphismCard(
      padding: const EdgeInsets.all(20),
      borderColor: accent.withValues(alpha: 0.28),
      child: Stack(
        children: [
          Positioned(
            right: -44,
            top: -52,
            child: _SoftGlow(color: accent, size: 150),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _AvatarMark(initial: initial, accent: accent),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Eyebrow(text: t('profileHeroEyebrow')),
                        const SizedBox(height: 10),
                        Text(
                          profile.username,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          profile.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _MetaChip(
                    icon: profile.isAdmin
                        ? Icons.admin_panel_settings_rounded
                        : Icons.verified_user_outlined,
                    label: profile.isAdmin
                        ? t('profileRoleAdmin')
                        : t('profileRoleMember'),
                    color: profile.isAdmin
                        ? AppColors.warning
                        : AppColors.primaryLight,
                  ),
                  _MetaChip(
                    icon: Icons.event_available_rounded,
                    label: t('profileMemberSince').replaceAll(
                      '{date}',
                      _formatDate(profile.createdAt, locale),
                    ),
                    color: AppColors.accentLight,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.09),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.auto_awesome_rounded, color: accent),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        t('profileAccountModeBody'),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileStatsGrid extends StatelessWidget {
  const _ProfileStatsGrid({
    required this.profile,
    required this.locale,
    required this.savedCount,
  });

  final ProfileModel profile;
  final String locale;
  final int savedCount;

  @override
  Widget build(BuildContext context) {
    final emotion = profile.mostFrequentEmotion == null
        ? null
        : Emotion.fromKey(profile.mostFrequentEmotion!);
    final items = [
      _ProfileStat(
        label: t('totalAnalyses'),
        value: '${profile.totalAnalyses}',
        icon: Icons.analytics_outlined,
        color: AppColors.primaryLight,
      ),
      _ProfileStat(
        label: t('mostFrequent'),
        value: emotion?.label(locale) ?? t('profileNoEmotionYet'),
        icon: emotion?.icon ?? Icons.psychology_alt_rounded,
        color: emotion?.color ?? AppColors.textTertiary,
      ),
      _ProfileStat(
        label: t('profileFeedbackCount'),
        value: '${profile.feedbackCount}',
        icon: Icons.rate_review_outlined,
        color: AppColors.warning,
      ),
      _ProfileStat(
        label: t('profileSavedCountLabel'),
        value: '$savedCount',
        icon: Icons.bookmark_added_outlined,
        color: AppColors.accentLight,
      ),
      _ProfileStat(
        label: t('profileRole'),
        value: profile.isAdmin ? t('profileRoleAdmin') : t('profileRoleMember'),
        icon: profile.isAdmin
            ? Icons.admin_panel_settings_outlined
            : Icons.person_outline,
        color: profile.isAdmin ? AppColors.warning : AppColors.secondaryLight,
      ),
      _ProfileStat(
        label: t('profileCreatedAt'),
        value: _formatDate(profile.createdAt, locale),
        icon: Icons.calendar_month_outlined,
        color: AppColors.info,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.42,
      ),
      itemBuilder: (context, index) => _ProfileStatTile(stat: items[index])
          .animate(delay: (40 * index).ms)
          .fadeIn(duration: 220.ms)
          .slideY(begin: 0.05, end: 0),
    );
  }
}

class _ProfileStatTile extends StatelessWidget {
  const _ProfileStatTile({required this.stat});

  final _ProfileStat stat;

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
          Icon(stat.icon, color: stat.color, size: 22),
          const Spacer(),
          Text(
            stat.value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            stat.label,
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

class _LanguageAndDataPanel extends StatelessWidget {
  const _LanguageAndDataPanel({
    required this.currentLocale,
    required this.onSetLocale,
    required this.onSettings,
  });

  final String currentLocale;
  final ValueChanged<String> onSetLocale;
  final VoidCallback onSettings;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('profileLanguageTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text(
            t('profileLanguageBody'),
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            showSelectedIcon: false,
            segments: [
              ButtonSegment(value: 'tr', label: Text(t('languageTurkish'))),
              ButtonSegment(value: 'en', label: Text(t('languageEnglish'))),
            ],
            selected: {currentLocale == 'en' ? 'en' : 'tr'},
            onSelectionChanged: (selection) => onSetLocale(selection.first),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _DataChip(label: t('profileDataHistory')),
              _DataChip(label: t('profileDataRecommendations')),
              _DataChip(label: t('profileDataFeedback')),
            ],
          ),
          const SizedBox(height: 14),
          PremiumButton(
            text: t('settings'),
            icon: Icons.settings_rounded,
            isSecondary: true,
            onPressed: onSettings,
          ),
        ],
      ),
    );
  }
}

class _SavedRecommendationsPanel extends StatefulWidget {
  const _SavedRecommendationsPanel({
    required this.items,
    required this.onRemove,
    required this.onClearAll,
    required this.onOpenExternal,
    required this.onOpenSourceResult,
  });

  final List<SavedRecommendation> items;
  final ValueChanged<String> onRemove;
  final VoidCallback onClearAll;
  final ValueChanged<String> onOpenExternal;
  final ValueChanged<String> onOpenSourceResult;

  @override
  State<_SavedRecommendationsPanel> createState() =>
      _SavedRecommendationsPanelState();
}

class _SavedRecommendationsPanelState
    extends State<_SavedRecommendationsPanel> {
  String _selectedType = 'all';

  List<SavedRecommendation> get _filteredItems {
    if (_selectedType == 'all') return widget.items;
    return widget.items
        .where((item) => _normalizeType(item.type) == _selectedType)
        .toList();
  }

  Map<String, int> get _counts {
    final counts = <String, int>{};
    for (final item in widget.items) {
      final type = _normalizeType(item.type);
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    final filteredItems = _filteredItems;
    final counts = _counts;

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Eyebrow(text: t('profileSavedEyebrow')),
                    const SizedBox(height: 10),
                    Text(
                      t('savedRecommendations'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('profileSavedBody'),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.items.isNotEmpty)
                IconButton(
                  tooltip: t('clearSavedRecommendations'),
                  onPressed: _confirmClearAll,
                  icon: const Icon(Icons.delete_sweep_outlined),
                ),
            ],
          ),
          const SizedBox(height: 12),
          _SavedCategorySummary(counts: counts, total: widget.items.length),
          if (widget.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _SavedFilterChip(
                    label: t('filterAll'),
                    selected: _selectedType == 'all',
                    count: widget.items.length,
                    onSelected: () => setState(() => _selectedType = 'all'),
                  ),
                  _SavedFilterChip(
                    label: t('filterMusic'),
                    selected: _selectedType == 'music',
                    count: counts['music'] ?? 0,
                    onSelected: () => setState(() => _selectedType = 'music'),
                  ),
                  _SavedFilterChip(
                    label: t('filterMovies'),
                    selected: _selectedType == 'movie',
                    count: counts['movie'] ?? 0,
                    onSelected: () => setState(() => _selectedType = 'movie'),
                  ),
                  _SavedFilterChip(
                    label: t('filterBooks'),
                    selected: _selectedType == 'book',
                    count: counts['book'] ?? 0,
                    onSelected: () => setState(() => _selectedType = 'book'),
                  ),
                  _SavedFilterChip(
                    label: t('filterAdvice'),
                    selected: _selectedType == 'advice',
                    count: counts['advice'] ?? 0,
                    onSelected: () => setState(() => _selectedType = 'advice'),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (widget.items.isEmpty)
            _InlineEmpty(
              icon: Icons.bookmark_border_rounded,
              title: t('profileSavedEmptyTitle'),
              body: t('savedRecommendationsEmpty'),
            )
          else if (filteredItems.isEmpty)
            _InlineEmpty(
              icon: Icons.filter_alt_off_rounded,
              title: t('profileSavedFilterEmptyTitle'),
              body: t('profileSavedFilterEmptyBody'),
            )
          else
            for (final entry in filteredItems.take(40).indexed)
              _SavedRecommendationCard(
                    item: entry.$2,
                    onRemove: () => widget.onRemove(entry.$2.id),
                    onOpenExternal: entry.$2.externalUrl == null
                        ? null
                        : () => widget.onOpenExternal(entry.$2.externalUrl!),
                    onOpenSourceResult: entry.$2.sourceHistoryId == null
                        ? null
                        : () => widget.onOpenSourceResult(
                            entry.$2.sourceHistoryId!,
                          ),
                  )
                  .animate(delay: (35 * entry.$1).ms)
                  .fadeIn(duration: 240.ms)
                  .slideX(begin: 0.04, end: 0),
        ],
      ),
    );
  }

  Future<void> _confirmClearAll() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t('clearSavedRecommendations')),
        content: Text(t('clearSavedRecommendationsConfirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(t('cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(t('delete')),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      widget.onClearAll();
      if (mounted) setState(() => _selectedType = 'all');
    }
  }
}

class _SavedRecommendationCard extends StatelessWidget {
  const _SavedRecommendationCard({
    required this.item,
    required this.onRemove,
    this.onOpenExternal,
    this.onOpenSourceResult,
  });

  final SavedRecommendation item;
  final VoidCallback onRemove;
  final VoidCallback? onOpenExternal;
  final VoidCallback? onOpenSourceResult;

  @override
  Widget build(BuildContext context) {
    final type = _normalizeType(item.type);
    final color = _typeColor(type);
    final subtitle = item.subtitle?.trim();
    final reason = item.reason?.trim();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SavedCover(item: item, type: type, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _MiniPill(label: _typeLabel(type), color: color),
                    if (item.emotion != null)
                      _MiniPill(
                        label: Emotion.fromKey(
                          item.emotion!,
                        ).label(AppLocalizations.currentLocale),
                        color: Emotion.colorFromKey(item.emotion!),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                if (subtitle != null && subtitle.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                if (reason != null && reason.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    reason,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _SmallAction(
                      icon: Icons.close_rounded,
                      label: t('profileSavedRemove'),
                      onPressed: onRemove,
                    ),
                    if (onOpenExternal != null)
                      _SmallAction(
                        icon: Icons.open_in_new_rounded,
                        label: t('profileSavedOpenExternal'),
                        onPressed: onOpenExternal!,
                      ),
                    if (onOpenSourceResult != null)
                      _SmallAction(
                        icon: Icons.analytics_outlined,
                        label: t('profileSavedOpenResult'),
                        onPressed: onOpenSourceResult!,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminShortcutPanel extends StatelessWidget {
  const _AdminShortcutPanel({required this.onMetrics});

  final VoidCallback onMetrics;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      borderColor: AppColors.warning.withValues(alpha: 0.25),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(
                Icons.admin_panel_settings_outlined,
                color: AppColors.warning,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  t('profileAdminPanel'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            t('profileAdminPanelBody'),
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          PremiumButton(
            text: t('metrics'),
            icon: Icons.analytics_rounded,
            onPressed: onMetrics,
          ),
          const SizedBox(height: 8),
          Text(
            t('csvExportUnavailable'),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
          ),
        ],
      ),
    );
  }
}

class _AccountActionsPanel extends StatelessWidget {
  const _AccountActionsPanel({
    required this.isDeleting,
    required this.isLoggingOut,
    required this.canDeleteAccount,
    required this.onSettings,
    required this.onLogout,
    required this.onDeleteAccount,
  });

  final bool isDeleting;
  final bool isLoggingOut;
  final bool canDeleteAccount;
  final VoidCallback onSettings;
  final VoidCallback onLogout;
  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('profileAccountActionsTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            t('profileAccountActionsBody'),
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),
          PremiumButton(
            text: t('settings'),
            icon: Icons.settings_rounded,
            isSecondary: true,
            onPressed: onSettings,
          ),
          const SizedBox(height: 10),
          PremiumButton(
            text: t('logout'),
            icon: Icons.logout_rounded,
            isLoading: isLoggingOut,
            isSecondary: true,
            onPressed: isDeleting || isLoggingOut ? null : onLogout,
          ),
          const SizedBox(height: 10),
          PremiumButton(
            text: t('deleteAccount'),
            icon: Icons.delete_outline_rounded,
            isLoading: isDeleting,
            isSecondary: true,
            onPressed: isDeleting || isLoggingOut || !canDeleteAccount
                ? null
                : onDeleteAccount,
          ),
        ],
      ),
    );
  }
}

class _GuestProfile extends StatelessWidget {
  const _GuestProfile({
    required this.remaining,
    required this.onLogin,
    required this.onRegister,
    required this.onAnalyze,
  });

  final int remaining;
  final VoidCallback onLogin;
  final VoidCallback onRegister;
  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    final progress = (remaining / AppConstants.guestAnalysisLimit).clamp(
      0.0,
      1.0,
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 28),
      children: [
        GlassmorphismCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.person_add_alt_1_rounded,
                color: AppColors.primaryLight,
                size: 44,
              ),
              const SizedBox(height: 14),
              Text(
                t('profileGuestTitle'),
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                t('profileGuestBody'),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              _QuotaBar(remaining: remaining, progress: progress),
              const SizedBox(height: 16),
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
              const SizedBox(height: 10),
              TextButton.icon(
                onPressed: onAnalyze,
                icon: const Icon(Icons.auto_awesome_rounded),
                label: Text(t('profileAnalyzeAsGuest')),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ProfileError extends StatelessWidget {
  const _ProfileError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ErrorState(
        title: t('profileLoadError'),
        body: t('profileLoadError'),
        actionLabel: t('retry'),
        onAction: onRetry,
      ),
    );
  }
}

class _DeleteAccountDialog extends StatefulWidget {
  const _DeleteAccountDialog({required this.profile});

  final ProfileModel profile;

  @override
  State<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<_DeleteAccountDialog> {
  final _controller = TextEditingController();

  bool get _canDelete {
    return _controller.text.trim().toUpperCase() ==
        widget.profile.deleteConfirmationText.toUpperCase();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(t('accountDeleteTitle')),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('accountDeleteBody').replaceAll(
              '{confirmation}',
              widget.profile.deleteConfirmationText,
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _controller,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: t('accountDeleteConfirmationLabel'),
              hintText: widget.profile.deleteConfirmationText,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _canDelete ? t('profileDeleteReady') : t('profileDeleteNotReady'),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: _canDelete ? AppColors.success : AppColors.warning,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(t('cancel')),
        ),
        FilledButton(
          onPressed: _canDelete ? () => Navigator.of(context).pop(true) : null,
          child: Text(t('delete')),
        ),
      ],
    );
  }
}

class _AvatarMark extends StatelessWidget {
  const _AvatarMark({required this.initial, required this.accent});

  final String initial;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 78,
      height: 78,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            accent.withValues(alpha: 0.5),
            Colors.white.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Text(
        initial,
        style: Theme.of(
          context,
        ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
      ),
    );
  }
}

class _SavedCover extends StatelessWidget {
  const _SavedCover({
    required this.item,
    required this.type,
    required this.color,
  });

  final SavedRecommendation item;
  final String type;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final imageUrl = item.imageUrl;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.network(
          imageUrl,
          width: 76,
          height: 96,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => _CoverFallback(type: type, color: color),
        ),
      );
    }
    return _CoverFallback(type: type, color: color);
  }
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback({required this.type, required this.color});

  final String type;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 76,
      height: 96,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Icon(_typeIcon(type), color: color, size: 30),
    );
  }
}

class _QuotaBar extends StatelessWidget {
  const _QuotaBar({required this.remaining, required this.progress});

  final int remaining;
  final double progress;

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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('profileGuestQuota').replaceAll('{remaining}', '$remaining'),
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 7,
              value: progress,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: const AlwaysStoppedAnimation(AppColors.primaryLight),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            t('profileGuestMigration'),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
          ),
        ],
      ),
    );
  }
}

class _SavedCategorySummary extends StatelessWidget {
  const _SavedCategorySummary({required this.counts, required this.total});

  final Map<String, int> counts;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _MiniPill(
          label: t('savedRecommendationsCount').replaceAll('{count}', '$total'),
          color: AppColors.primaryLight,
        ),
        _MiniPill(
          label: '${t('filterMusic')} ${counts['music'] ?? 0}',
          color: _typeColor('music'),
        ),
        _MiniPill(
          label: '${t('filterMovies')} ${counts['movie'] ?? 0}',
          color: _typeColor('movie'),
        ),
        _MiniPill(
          label: '${t('filterBooks')} ${counts['book'] ?? 0}',
          color: _typeColor('book'),
        ),
        _MiniPill(
          label: '${t('filterAdvice')} ${counts['advice'] ?? 0}',
          color: _typeColor('advice'),
        ),
      ],
    );
  }
}

class _SavedFilterChip extends StatelessWidget {
  const _SavedFilterChip({
    required this.label,
    required this.selected,
    required this.count,
    required this.onSelected,
  });

  final String label;
  final bool selected;
  final int count;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        selected: selected,
        onSelected: (_) => onSelected(),
        label: Text('$label ($count)'),
        avatar: selected
            ? const Icon(Icons.check_rounded, size: 16)
            : Icon(_typeIcon(_chipType(label)), size: 16),
      ),
    );
  }
}

class _SmallAction extends StatelessWidget {
  const _SmallAction({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        visualDensity: VisualDensity.compact,
        padding: const EdgeInsets.symmetric(horizontal: 8),
      ),
      icon: Icon(icon, size: 16),
      label: Text(label, overflow: TextOverflow.ellipsis),
    );
  }
}

class _MiniPill extends StatelessWidget {
  const _MiniPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: color),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}

class _DataChip extends StatelessWidget {
  const _DataChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Text(
        label,
        style: Theme.of(
          context,
        ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
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
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleSmall,
          ),
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

class _SoftGlow extends StatelessWidget {
  const _SoftGlow({required this.color, required this.size});

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

class _ProfileStat {
  const _ProfileStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
}

String _formatDate(DateTime? value, String locale) {
  if (value == null) return t('profileNewAccount');
  final pattern = locale == 'en' ? 'MMM d, yyyy' : 'dd.MM.yyyy';
  return DateFormat(pattern, locale).format(value.toLocal());
}

String _normalizeType(String type) {
  final normalized = type.toLowerCase().trim();
  if (normalized == 'movies') return 'movie';
  if (normalized == 'books') return 'book';
  if (normalized == 'lifeadvice' || normalized == 'life_advice') {
    return 'advice';
  }
  if (normalized == 'music' ||
      normalized == 'movie' ||
      normalized == 'book' ||
      normalized == 'advice') {
    return normalized;
  }
  return 'advice';
}

String _typeLabel(String type) {
  return switch (_normalizeType(type)) {
    'music' => t('filterMusic'),
    'movie' => t('filterMovies'),
    'book' => t('filterBooks'),
    'advice' => t('filterAdvice'),
    _ => t('profileSavedTypeUnknown'),
  };
}

IconData _typeIcon(String type) {
  return switch (_normalizeType(type)) {
    'music' => Icons.library_music_outlined,
    'movie' => Icons.local_movies_outlined,
    'book' => Icons.menu_book_outlined,
    'advice' => Icons.tips_and_updates_outlined,
    _ => Icons.bookmark_outline_rounded,
  };
}

Color _typeColor(String type) {
  return switch (_normalizeType(type)) {
    'music' => AppColors.primaryLight,
    'movie' => AppColors.warning,
    'book' => AppColors.secondaryLight,
    'advice' => AppColors.success,
    _ => AppColors.textSecondary,
  };
}

String _chipType(String label) {
  if (label == t('filterMusic')) return 'music';
  if (label == t('filterMovies')) return 'movie';
  if (label == t('filterBooks')) return 'book';
  if (label == t('filterAdvice')) return 'advice';
  return 'all';
}
