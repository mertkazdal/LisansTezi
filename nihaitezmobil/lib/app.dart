/// Root MaterialApp configuration for MoodLens mobile.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/i18n/app_localizations.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/network_status_banner.dart';
import 'features/settings/presentation/providers/settings_provider.dart';
import 'shared/providers/locale_provider.dart';

class MoodLensApp extends ConsumerWidget {
  const MoodLensApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);
    AppLocalizations.setLocale(locale.languageCode);

    return MaterialApp.router(
      title: 'MoodLens',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [AppLocalizations.delegate],
      builder: (context, child) {
        return Stack(
          children: [
            child ?? const SizedBox.shrink(),
            const NetworkStatusBanner(),
          ],
        );
      },
      routerConfig: appRouter,
    );
  }
}
