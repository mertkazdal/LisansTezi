/// Remote data source for feedback endpoints.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/feedback_models.dart';

class FeedbackRemoteSource {
  FeedbackRemoteSource(this._dio);

  final Dio _dio;

  Future<FeedbackResponse?> getFeedback({
    required String historyId,
    required String guestSessionId,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '${ApiConstants.feedback}/$historyId',
        queryParameters: {'guestSessionId': guestSessionId},
        options: Options(extra: {'skipAuthClear': true}),
      );
      return FeedbackResponse.fromJson(response.data ?? <String, dynamic>{});
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<FeedbackResponse> submitFeedback({
    required String historyId,
    required String guestSessionId,
    required FeedbackRequest request,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '${ApiConstants.feedback}/$historyId',
      queryParameters: {'guestSessionId': guestSessionId},
      data: request.toJson(),
      options: Options(extra: {'skipAuthClear': true}),
    );
    final payload = response.data ?? <String, dynamic>{};
    final feedback = payload['feedback'];
    return FeedbackResponse.fromJson(
      feedback is Map<String, dynamic> ? feedback : payload,
    );
  }
}
