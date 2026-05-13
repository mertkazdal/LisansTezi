/// Riverpod settings providers for theme mode and persisted app preferences.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/storage/preferences_service.dart';
import '../../../../shared/providers/storage_provider.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((
  ref,
) {
  return ThemeModeNotifier(ref.watch(preferencesServiceProvider));
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier(this._preferences) : super(_preferences.getThemeMode());

  final PreferencesService _preferences;

  Future<void> setThemeMode(ThemeMode mode) async {
    await _preferences.setThemeMode(mode);
    state = mode;
  }
}
