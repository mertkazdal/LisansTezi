/// Configured Dio client for the MoodLens backend.
library;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/api_constants.dart';
import '../storage/preferences_service.dart';
import '../storage/secure_storage_service.dart';
import 'api_interceptor.dart';

class DioClient {
  DioClient({
    required SecureStorageService secureStorage,
    required PreferencesService preferences,
    VoidCallback? onUnauthorized,
  }) : dio = Dio(
         BaseOptions(
           baseUrl: ApiConstants.currentBaseUrl,
           connectTimeout: const Duration(
             milliseconds: ApiConstants.connectTimeoutMs,
           ),
           receiveTimeout: const Duration(
             milliseconds: ApiConstants.receiveTimeoutMs,
           ),
           sendTimeout: const Duration(
             milliseconds: ApiConstants.sendTimeoutMs,
           ),
           contentType: Headers.jsonContentType,
         ),
       ) {
    dio.interceptors.add(
      ApiInterceptor(
        secureStorage,
        preferences,
        onUnauthorized: onUnauthorized,
      ),
    );

    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          logPrint: (obj) => debugPrint(obj.toString()),
        ),
      );
    }
  }

  final Dio dio;
}
