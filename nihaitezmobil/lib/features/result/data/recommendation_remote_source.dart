/// Remote data source for recommendation and result detail endpoints.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/recommendation_models.dart';

class RecommendationRemoteSource {
  RecommendationRemoteSource(this._dio);

  final Dio _dio;

  Future<ResultDetail> getResultDetail({
    required String historyId,
    required String guestSessionId,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '${ApiConstants.recommendations}/$historyId',
      queryParameters: {'guestSessionId': guestSessionId},
      options: Options(extra: {'skipAuthClear': true}),
    );
    return ResultDetail.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<RecommendationBundle> getRecommendations({
    required String historyId,
    required String guestSessionId,
  }) async {
    final detail = await getResultDetail(
      historyId: historyId,
      guestSessionId: guestSessionId,
    );
    return detail.recommendations;
  }
}
