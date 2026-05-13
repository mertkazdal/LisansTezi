/// Standardized exception type for API and networking failures.
library;

import '../i18n/app_localizations.dart';

class ApiException implements Exception {
  ApiException({
    required this.message,
    this.code,
    this.statusCode,
    this.details,
  });

  final String message;
  final String? code;
  final int? statusCode;
  final dynamic details;

  factory ApiException.unknown([dynamic error]) {
    return ApiException(
      message: t('unknownError'),
      code: 'UNKNOWN_ERROR',
      details: error,
    );
  }

  factory ApiException.network() {
    return ApiException(message: t('networkError'), code: 'NETWORK_ERROR');
  }

  factory ApiException.timeout() {
    return ApiException(message: t('timeoutError'), code: 'TIMEOUT_ERROR');
  }

  factory ApiException.fromBackend({
    required dynamic payload,
    required int? statusCode,
    String? fallbackMessage,
  }) {
    final payloadMap = _asStringMap(payload);
    final nestedError = _asStringMap(payloadMap?['error']);
    final message = _firstNonEmpty([
      payloadMap?['message'],
      payloadMap?['detail'],
      nestedError?['message'],
      payload is String ? payload : null,
      fallbackMessage,
    ]);
    final code = _firstNonEmpty([payloadMap?['code'], nestedError?['code']]);

    return ApiException(
      message: _messageForStatus(statusCode, code, message),
      code: code,
      statusCode: statusCode,
      details: payloadMap ?? payload,
    );
  }

  static Map<String, dynamic>? _asStringMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, item) => MapEntry(key.toString(), item));
    }
    return null;
  }

  static String? _firstNonEmpty(Iterable<dynamic> values) {
    for (final value in values) {
      final text = value?.toString().trim();
      if (text != null && text.isNotEmpty) return text;
    }
    return null;
  }

  static String _messageForStatus(
    int? statusCode,
    String? code,
    String? backendMessage,
  ) {
    final localized = _localizedBackendMessage(code, backendMessage);
    if (localized != null) {
      return localized;
    }

    final status = statusCode ?? 0;
    return switch (status) {
      400 => t('validationError'),
      401 => t('unauthorizedError'),
      403 => t('forbiddenError'),
      >= 500 => t('serverError'),
      _ => t('unknownError'),
    };
  }

  static String? _localizedBackendMessage(String? code, String? message) {
    return switch (code) {
      'GUEST_QUOTA_EXCEEDED' => t('guestQuotaExceeded'),
      'GUEST_SESSION_REQUIRED' => t('guestSessionRequired'),
      _ => switch (message) {
        'Authentication is required.' => t('loginRequired'),
        'User not found.' => t('unauthorizedError'),
        'Invalid confirmation text.' => t('deleteAccountFailed'),
        'Feedback ratings must be between 1 and 5.' => t(
          'feedbackInvalidRating',
        ),
        'At least one text or image input is required.' => t(
          'analysisInputRequired',
        ),
        'Unsupported image format.' => t('unsupportedImageFormat'),
        _ => message,
      },
    };
  }

  @override
  String toString() {
    return 'ApiException: $message (Status: $statusCode, Code: $code)';
  }
}
