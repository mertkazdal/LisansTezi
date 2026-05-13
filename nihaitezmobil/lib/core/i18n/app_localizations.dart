/// Lightweight TR/EN localization helper used by the first mobile scaffold.
library;

import 'package:flutter/widgets.dart';

import 'en.dart';
import 'tr.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const supportedLocales = [Locale('tr'), Locale('en')];

  static String _currentLocale = 'tr';

  final String locale;

  static void setLocale(String locale) {
    _currentLocale = _normalizeLocale(locale);
  }

  static String get currentLocale => _currentLocale;

  static Map<String, String> get _translations {
    if (_currentLocale == 'en') return enTranslations;
    return trTranslations;
  }

  static String translate(String key) {
    return _translations[key] ?? key;
  }

  static String _normalizeLocale(String locale) {
    final code = locale.toLowerCase().split('_').first.split('-').first;
    return code == 'en' ? 'en' : 'tr';
  }
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return AppLocalizations.supportedLocales.any(
      (supported) => supported.languageCode == locale.languageCode,
    );
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    AppLocalizations.setLocale(locale.languageCode);
    return AppLocalizations(AppLocalizations.currentLocale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

String t(String key) => AppLocalizations.translate(key);
