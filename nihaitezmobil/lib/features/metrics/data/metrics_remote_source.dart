/// Remote data source for admin metrics endpoints.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/metrics_models.dart';

class MetricsRemoteSource {
  MetricsRemoteSource(this._dio);

  final Dio _dio;

  Future<MetricsDashboard> getDashboard() async {
    final data = await _getMap(ApiConstants.metricsDashboard);
    return MetricsDashboard.fromJson(data);
  }

  Future<Map<String, dynamic>> getResearch() {
    return _getMap(ApiConstants.metricsResearch);
  }

  Future<Map<String, dynamic>> getComparison() {
    return _getMap(ApiConstants.metricsComparison);
  }

  Future<ResponseTimeSummary> getResponseTimes() async {
    final data = await _getMap(ApiConstants.metricsResponseTimes);
    return ResponseTimeSummary.fromJson(data);
  }

  Future<List<EmotionDistributionPoint>> getEmotionDistribution() async {
    final data = await _getMap(ApiConstants.metricsEmotionDistribution);
    final emotionCounts = data['emotion_counts'] ?? data['emotionCounts'];
    if (emotionCounts is Map) {
      final total =
          (data['total'] as num?)?.toInt() ??
          emotionCounts.values.fold<int>(
            0,
            (sum, value) => sum + _toInt(value),
          );
      final points = emotionCounts.entries.map((entry) {
        return EmotionDistributionPoint.fromJson({
          'emotion': entry.key.toString(),
          'count': entry.value,
        }, total: total);
      }).toList();
      points.sort((left, right) => right.count.compareTo(left.count));
      return points;
    }

    final rawItems =
        data['items'] ?? data['distribution'] ?? data['topEmotions'];
    if (rawItems is! List) return const [];
    final total = rawItems.fold<int>(0, (sum, item) {
      if (item is! Map) return sum;
      return sum + _toInt(item['count']);
    });

    final points = rawItems.whereType<Map>().map((item) {
      return EmotionDistributionPoint.fromJson(Map.from(item), total: total);
    }).toList();
    points.sort((left, right) => right.count.compareTo(left.count));
    return points;
  }

  Future<Map<String, dynamic>> getAdminOverview() {
    return _getMap(ApiConstants.adminOverview);
  }

  Future<Map<String, dynamic>> _getMap(String path) async {
    final response = await _dio.get<dynamic>(path);
    final data = response.data;
    if (data is Map<String, dynamic>) return data;
    if (data is Map) {
      return data.map((key, value) => MapEntry(key.toString(), value));
    }
    return <String, dynamic>{};
  }

  int _toInt(Object? value) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
