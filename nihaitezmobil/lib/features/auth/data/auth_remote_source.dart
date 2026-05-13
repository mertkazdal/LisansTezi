/// Remote data source for auth endpoints.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class AuthRemoteSource {
  AuthRemoteSource(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    required String guestSessionId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiConstants.login,
      data: {
        'email': email.trim(),
        'password': password,
        'guestSessionId': guestSessionId,
      },
      options: Options(extra: {'skipAuthClear': true}),
    );
    return response.data ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String guestSessionId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiConstants.register,
      data: {
        'username': username.trim(),
        'email': email.trim(),
        'password': password,
        'guestSessionId': guestSessionId,
      },
      options: Options(extra: {'skipAuthClear': true}),
    );
    return response.data ?? <String, dynamic>{};
  }
}
