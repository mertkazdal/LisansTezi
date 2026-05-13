/// SharedPreferences wrapper for locale, theme, onboarding, and guest state.
library;

import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../constants/app_constants.dart';

class PreferencesService {
  PreferencesService(this._prefs);

  final SharedPreferences _prefs;

  String getLocale() {
    final stored = _prefs.getString(AppConstants.localeKey);
    if (stored == 'tr' || stored == 'en') {
      return stored!;
    }

    final deviceLanguage = PlatformDispatcher.instance.locale.languageCode
        .toLowerCase();
    return deviceLanguage == 'en' ? 'en' : 'tr';
  }

  Future<void> setLocale(String localeCode) async {
    final normalized = localeCode == 'en' ? 'en' : 'tr';
    await _prefs.setString(AppConstants.localeKey, normalized);
  }

  ThemeMode getThemeMode() {
    final value = _prefs.getString(AppConstants.themeModeKey);
    return switch (value) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.dark,
    };
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(AppConstants.themeModeKey, value);
  }

  bool isOnboardingCompleted() {
    return _prefs.getBool(AppConstants.onboardingCompletedKey) ?? false;
  }

  Future<void> setOnboardingCompleted({bool completed = true}) async {
    await _prefs.setBool(AppConstants.onboardingCompletedKey, completed);
  }

  String getGuestSessionId() {
    var sessionId = _prefs.getString(AppConstants.guestSessionKey);
    if (sessionId == null || sessionId.isEmpty) {
      sessionId = const Uuid().v4();
      _prefs.setString(AppConstants.guestSessionKey, sessionId);
    }
    return sessionId;
  }

  Future<void> clearGuestSessionId() async {
    await _prefs.remove(AppConstants.guestSessionKey);
    await _prefs.remove(AppConstants.guestRemainingKey);
  }

  Future<void> resetGuestQuotaState() async {
    await _prefs.remove(AppConstants.guestRemainingKey);
  }

  int getGuestRemainingAnalyses() {
    return _prefs.getInt(AppConstants.guestRemainingKey) ??
        AppConstants.guestAnalysisLimit;
  }

  Future<void> setGuestRemainingAnalyses(int count) async {
    await _prefs.setInt(AppConstants.guestRemainingKey, count < 0 ? 0 : count);
  }
}
