/// Feedback request and response models for analysis quality ratings.
library;

class FeedbackRequest {
  const FeedbackRequest({
    required this.overallRating,
    required this.analysisAccuracyRating,
    required this.recommendationQualityRating,
    required this.helpful,
    required this.wouldReuse,
    this.comment,
  });

  final int overallRating;
  final int analysisAccuracyRating;
  final int recommendationQualityRating;
  final bool helpful;
  final bool wouldReuse;
  final String? comment;

  Map<String, dynamic> toJson() {
    return {
      'overallRating': overallRating,
      'analysisAccuracyRating': analysisAccuracyRating,
      'recommendationQualityRating': recommendationQualityRating,
      'helpful': helpful,
      'wouldReuse': wouldReuse,
      'comment': comment?.trim(),
    }..removeWhere((_, value) {
      return value == null || (value is String && value.isEmpty);
    });
  }
}

class FeedbackResponse {
  const FeedbackResponse({
    required this.id,
    required this.historyId,
    required this.overallRating,
    required this.analysisAccuracyRating,
    required this.recommendationQualityRating,
    required this.helpful,
    required this.wouldReuse,
    this.comment,
    this.createdAt,
  });

  final String id;
  final String historyId;
  final int overallRating;
  final int analysisAccuracyRating;
  final int recommendationQualityRating;
  final bool helpful;
  final bool wouldReuse;
  final String? comment;
  final DateTime? createdAt;

  factory FeedbackResponse.fromJson(Map<String, dynamic> json) {
    return FeedbackResponse(
      id: (json['id'] ?? '').toString(),
      historyId: (json['historyId'] ?? '').toString(),
      overallRating: _toInt(json['overallRating']),
      analysisAccuracyRating: _toInt(json['analysisAccuracyRating']),
      recommendationQualityRating: _toInt(json['recommendationQualityRating']),
      helpful: json['helpful'] == true,
      wouldReuse: json['wouldReuse'] == true,
      comment: _nullableString(json['comment']),
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()),
    );
  }

  static String? _nullableString(dynamic value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static int _toInt(dynamic value) {
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}
