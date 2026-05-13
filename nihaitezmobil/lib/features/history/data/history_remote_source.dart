/// Remote data source for history endpoints.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/history_models.dart';

class HistoryRemoteSource {
  HistoryRemoteSource(this._dio);

  final Dio _dio;

  Future<PaginatedHistory> getHistory({int page = 1, int limit = 10}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      ApiConstants.history,
      queryParameters: {'page': page, 'limit': limit},
    );
    return PaginatedHistory.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<HistoryItem> getHistoryItem(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '${ApiConstants.history}/$id',
    );
    return HistoryItem.fromJson(response.data ?? <String, dynamic>{});
  }
}
