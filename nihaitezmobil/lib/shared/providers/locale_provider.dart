/// Riverpod locale provider backed by PreferencesService.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n/app_localizations.dart';
import '../../core/storage/preferences_service.dart';
import 'storage_provider.dart';

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier(ref.watch(preferencesServiceProvider));
});

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier(this._preferences) : super(Locale(_preferences.getLocale())) {
    AppLocalizations.setLocale(state.languageCode);
  }

  final PreferencesService _preferences;

  Future<void> setLocale(Locale locale) async {
    final normalized = locale.languageCode == 'en'
        ? const Locale('en')
        : const Locale('tr');
    await _preferences.setLocale(normalized.languageCode);
    AppLocalizations.setLocale(normalized.languageCode);
    state = normalized;
  }
}
