/// Riverpod providers for persistent and secure storage services.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/storage/preferences_service.dart';
import '../../core/storage/secure_storage_service.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'SharedPreferences must be overridden before MoodLensApp starts.',
  );
});

final preferencesServiceProvider = Provider<PreferencesService>((ref) {
  return PreferencesService(ref.watch(sharedPreferencesProvider));
});

final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final onboardingCompletedProvider = Provider<bool>((ref) {
  return ref.watch(preferencesServiceProvider).isOnboardingCompleted();
});

final guestSessionIdProvider = Provider<String>((ref) {
  return ref.watch(preferencesServiceProvider).getGuestSessionId();
});

final guestRemainingAnalysesProvider = Provider<int>((ref) {
  return ref.watch(preferencesServiceProvider).getGuestRemainingAnalyses();
});
