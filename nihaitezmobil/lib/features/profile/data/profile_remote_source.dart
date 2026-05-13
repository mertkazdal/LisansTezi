/// Remote data source for user profile endpoints.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/profile_models.dart';

class ProfileRemoteSource {
  ProfileRemoteSource(this._dio);

  final Dio _dio;

  Future<ProfileModel> getProfile() async {
    final response = await _dio.get<Map<String, dynamic>>(
      ApiConstants.userProfile,
    );
    return ProfileModel.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<AccountDeletionResult> deleteAccount({
    String confirmationText = 'DELETE',
  }) async {
    final response = await _dio.delete<Map<String, dynamic>>(
      ApiConstants.deleteAccount,
      data: {'confirmationText': confirmationText},
    );
    return AccountDeletionResult.fromJson(
      response.data ?? <String, dynamic>{},
    );
  }
}
