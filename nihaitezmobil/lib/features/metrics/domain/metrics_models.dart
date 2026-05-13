/// Metrics models aligned with the backend admin and research endpoints.
library;

class MetricsBundle {
  const MetricsBundle({
    required this.dashboard,
    required this.emotionDistribution,
    required this.responseTimes,
    required this.research,
    required this.comparison,
    required this.adminOverview,
  });

  final MetricsDashboard dashboard;
  final List<EmotionDistributionPoint> emotionDistribution;
  final ResponseTimeSummary responseTimes;
  final Map<String, dynamic> research;
  final Map<String, dynamic> comparison;
  final Map<String, dynamic> adminOverview;

  bool get hasUsableData {
    return dashboard.totalAnalyses > 0 ||
        dashboard.totalFeedbackResponses > 0 ||
        dashboard.totalUsers > 0 ||
        emotionDistribution.isNotEmpty ||
        responseTimes.samples.isNotEmpty;
  }
}

class MetricsDashboard {
  const MetricsDashboard({
    required this.totalAnalyses,
    required this.totalUsers,
    required this.guestAnalyses,
    required this.registeredAnalyses,
    required this.guestSessions,
    required this.totalFeedbackResponses,
    required this.averageConfidence,
    required this.averageResponseTimeMs,
    required this.averageOverallRating,
    required this.averageAnalysisAccuracyRating,
    required this.averageRecommendationQualityRating,
    required this.helpfulRate,
    required this.wouldReuseRate,
    required this.faceDetectedRate,
    required this.recommendationCoverageRate,
    this.message = '',
    this.raw = const {},
  });

  final int totalAnalyses;
  final int totalUsers;
  final int guestAnalyses;
  final int registeredAnalyses;
  final int guestSessions;
  final int totalFeedbackResponses;
  final double averageConfidence;
  final double averageResponseTimeMs;
  final double averageOverallRating;
  final double averageAnalysisAccuracyRating;
  final double averageRecommendationQualityRating;
  final double helpfulRate;
  final double wouldReuseRate;
  final double faceDetectedRate;
  final double recommendationCoverageRate;
  final String message;
  final Map<String, dynamic> raw;

  factory MetricsDashboard.fromJson(Map<String, dynamic> json) {
    final summary = _asMap(json['summary']) ?? json;
    return MetricsDashboard(
      totalAnalyses: _readInt(summary, ['totalAnalyses', 'total_analyses']),
      totalUsers: _readInt(summary, [
        'totalUsers',
        'registeredUsers',
        'total_users',
      ]),
      guestAnalyses: _readInt(summary, ['guestAnalyses', 'guest_analyses']),
      registeredAnalyses: _readInt(summary, [
        'registeredAnalyses',
        'registered_analyses',
      ]),
      guestSessions: _readInt(summary, ['guestSessions', 'guest_sessions']),
      totalFeedbackResponses: _readInt(summary, [
        'totalFeedbackResponses',
        'totalResponses',
        'total_feedback_responses',
      ]),
      averageConfidence: _readDouble(summary, [
        'averageConfidence',
        'avgConfidence',
        'average_confidence',
      ]),
      averageResponseTimeMs: _readDouble(summary, [
        'averageResponseTimeMs',
        'average_response_time_ms',
      ]),
      averageOverallRating: _readDouble(summary, [
        'averageOverallRating',
        'average_rating',
      ]),
      averageAnalysisAccuracyRating: _readDouble(summary, [
        'averageAnalysisAccuracyRating',
        'average_analysis_accuracy_rating',
      ]),
      averageRecommendationQualityRating: _readDouble(summary, [
        'averageRecommendationQualityRating',
        'average_recommendation_quality_rating',
      ]),
      helpfulRate: _readDouble(summary, ['helpfulRate', 'helpful_rate']),
      wouldReuseRate: _readDouble(summary, [
        'wouldReuseRate',
        'would_reuse_rate',
      ]),
      faceDetectedRate: _readDouble(summary, [
        'faceDetectedRate',
        'face_detected_rate',
      ]),
      recommendationCoverageRate: _readDouble(summary, [
        'recommendationCoverageRate',
        'recommendation_coverage_rate',
      ]),
      message: (json['message'] ?? '').toString(),
      raw: json,
    );
  }
}

class EmotionDistributionPoint {
  const EmotionDistributionPoint({
    required this.emotion,
    required this.count,
    required this.percentage,
  });

  final String emotion;
  final int count;
  final double percentage;

  factory EmotionDistributionPoint.fromJson(
    Map<String, dynamic> json, {
    int total = 0,
  }) {
    final count = _readInt(json, ['count', 'value']);
    final percentage = _readDouble(json, ['percentage', 'rate']);
    final computedPercentage = total <= 0 ? 0.0 : (count / total) * 100;
    return EmotionDistributionPoint(
      emotion: (json['emotion'] ?? json['detectedEmotion'] ?? json['key'] ?? '')
          .toString(),
      count: count,
      percentage: percentage > 0 ? percentage : computedPercentage,
    );
  }
}

class ResponseTimeSummary {
  const ResponseTimeSummary({
    required this.average,
    required this.min,
    required this.max,
    required this.samples,
    this.raw = const {},
  });

  final int average;
  final int min;
  final int max;
  final List<ResponseTimeSample> samples;
  final Map<String, dynamic> raw;

  factory ResponseTimeSummary.fromJson(Map<String, dynamic> json) {
    final rawSamples = json['samples'];
    final samples = rawSamples is List
        ? rawSamples
              .whereType<Map>()
              .map((item) => ResponseTimeSample.fromJson(Map.from(item)))
              .toList()
        : const <ResponseTimeSample>[];
    return ResponseTimeSummary(
      average: _readInt(json, ['average', 'avg']),
      min: _readInt(json, ['min']),
      max: _readInt(json, ['max']),
      samples: samples,
      raw: json,
    );
  }

  static const empty = ResponseTimeSummary(
    average: 0,
    min: 0,
    max: 0,
    samples: [],
  );
}

class ResponseTimeSample {
  const ResponseTimeSample({
    required this.createdAt,
    required this.responseTimeMs,
    required this.emotion,
  });

  final DateTime? createdAt;
  final int responseTimeMs;
  final String emotion;

  factory ResponseTimeSample.fromJson(Map<String, dynamic> json) {
    return ResponseTimeSample(
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()),
      responseTimeMs: _readInt(json, ['responseTimeMs', 'response_time_ms']),
      emotion: (json['emotion'] ?? '').toString(),
    );
  }
}

Map<String, dynamic>? _asMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return null;
}

int _readInt(Map<String, dynamic> json, List<String> keys) {
  for (final key in keys) {
    final value = json[key];
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
  }
  return 0;
}

double _readDouble(Map<String, dynamic> json, List<String> keys) {
  for (final key in keys) {
    final value = json[key];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
  }
  return 0;
}
