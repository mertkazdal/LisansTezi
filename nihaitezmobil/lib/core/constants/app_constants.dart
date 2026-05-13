/// Application-wide constants for storage keys, limits, and timing values.
library;

class AppConstants {
  AppConstants._();

  static const String appName = 'MoodLens';
  static const String appNameFull = 'MoodLens - AI Life Coach';
  static const String appVersion = '1.0.0';

  static const int guestAnalysisLimit = 3;
  static const String guestSessionKey = 'moodlens_guest_session_id';
  static const String guestRemainingKey = 'moodlens_guest_remaining';

  static const String tokenKey = 'access_token';
  static const String userKey = 'tezfinal_user';
  static const String localeKey = 'app_locale';
  static const String themeModeKey = 'theme_mode';
  static const String onboardingCompletedKey = 'onboarding_completed';

  static const Duration animFast = Duration(milliseconds: 200);
  static const Duration animNormal = Duration(milliseconds: 350);
  static const Duration animSlow = Duration(milliseconds: 500);
  static const Duration animVerySlow = Duration(milliseconds: 800);
  static const Duration splashDuration = Duration(milliseconds: 2500);
  static const Duration pageTransition = Duration(milliseconds: 300);

  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  static const int maxImageSizeBytes = 10 * 1024 * 1024;
  static const double imageQuality = 0.85;
  static const int maxImageWidth = 1024;
  static const int maxImageHeight = 1024;
}
