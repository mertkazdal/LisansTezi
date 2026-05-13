/// Dio interceptor that attaches auth, language, and guest-session headers.
library;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../storage/preferences_service.dart';
import '../storage/secure_storage_service.dart';
import 'api_exception.dart';

class ApiInterceptor extends Interceptor {
  ApiInterceptor(this._secureStorage, this._preferences, {this.onUnauthorized});

  final SecureStorageService _secureStorage;
  final PreferencesService _preferences;
  final VoidCallback? onUnauthorized;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    final locale = _preferences.getLocale();
    options.headers['X-MoodLens-Language'] = locale;
    options.headers['Accept-Language'] = locale;
    options.headers['X-Guest-Session-Id'] = _preferences.getGuestSessionId();

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final skipAuthClear = err.requestOptions.extra['skipAuthClear'] == true;

    if (err.response?.statusCode == 401 && !skipAuthClear) {
      await _secureStorage.deleteToken();
      await _secureStorage.deleteUser();
      onUnauthorized?.call();
    }

    final data = err.response?.data;
    if (_readErrorCode(data) == 'GUEST_QUOTA_EXCEEDED') {
      await _preferences.setGuestRemainingAnalyses(0);
    }

    final appException = _mapDioErrorToApiException(err);
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: appException,
      ),
    );
  }

  ApiException _mapDioErrorToApiException(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      return ApiException.timeout();
    }

    if (err.type == DioExceptionType.connectionError) {
      return ApiException.network();
    }

    return ApiException.fromBackend(
      payload: err.response?.data,
      statusCode: err.response?.statusCode,
      fallbackMessage: err.message,
    );
  }

  String? _readErrorCode(dynamic data) {
    if (data is Map) {
      final directCode = data['code']?.toString();
      if (directCode != null && directCode.isNotEmpty) return directCode;

      final error = data['error'];
      if (error is Map) {
        final nestedCode = error['code']?.toString();
        if (nestedCode != null && nestedCode.isNotEmpty) return nestedCode;
      }
    }
    return null;
  }
}
