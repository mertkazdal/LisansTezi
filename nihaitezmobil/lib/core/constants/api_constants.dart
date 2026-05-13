/// MoodLens API endpoint constants used by the mobile client.
library;

import 'package:flutter/foundation.dart';

class ApiConstants {
  ApiConstants._();

  static const String customBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:5000';
  static const String localHostBaseUrl = 'http://localhost:5000';

  static bool get hasCustomBaseUrl => customBaseUrl.trim().isNotEmpty;

  static String get currentBaseUrl => resolveBaseUrl();

  static String resolveBaseUrl({TargetPlatform? platform, bool? isWeb}) {
    final override = customBaseUrl.trim();
    if (override.isNotEmpty) {
      return _trimTrailingSlash(override);
    }

    if (isWeb ?? kIsWeb) {
      return localHostBaseUrl;
    }

    return switch (platform ?? defaultTargetPlatform) {
      TargetPlatform.android => androidEmulatorBaseUrl,
      TargetPlatform.fuchsia ||
      TargetPlatform.iOS ||
      TargetPlatform.linux ||
      TargetPlatform.macOS ||
      TargetPlatform.windows => localHostBaseUrl,
    };
  }

  static String _trimTrailingSlash(String value) {
    return value.endsWith('/') ? value.substring(0, value.length - 1) : value;
  }

  static const String register = '/api/auth/register';
  static const String login = '/api/auth/login';
  static const String analyze = '/api/analyze';
  static const String recommendations = '/api/recommendations';
  static const String history = '/api/history';
  static const String userProfile = '/api/user/profile';
  static const String deleteAccount = '/api/user/account';
  static const String feedback = '/api/feedback';
  static const String metricsDashboard = '/api/metrics/dashboard';
  static const String metricsResearch = '/api/metrics/research';
  static const String metricsComparison = '/api/metrics/comparison';
  static const String metricsResponseTimes = '/api/metrics/response-times';
  static const String metricsEmotionDistribution =
      '/api/metrics/emotion-distribution';
  static const String adminOverview = '/api/admin/overview';
  static const String adminExportCsv = '/api/admin/export/csv';
  static const String health = '/health';

  static const int connectTimeoutMs = 15000;
  static const int receiveTimeoutMs = 120000;
  static const int sendTimeoutMs = 30000;
}
