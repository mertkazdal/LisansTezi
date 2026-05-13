/// History list domain models.
library;

class HistoryItem {
  const HistoryItem({
    required this.id,
    required this.emotion,
    required this.confidence,
    this.explanation,
    this.userText,
    required this.createdAt,
    required this.modalityUsed,
    required this.modelUsed,
    this.responseTimeMs,
    required this.faceDetected,
  });

  final String id;
  final String emotion;
  final double confidence;
  final String? explanation;
  final String? userText;
  final DateTime createdAt;
  final String modalityUsed;
  final String modelUsed;
  final int? responseTimeMs;
  final bool faceDetected;

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    return HistoryItem(
      id: (json['id'] ?? '').toString(),
      emotion: (json['detectedEmotion'] ?? json['emotion'] ?? 'calm')
          .toString(),
      confidence: _toDouble(json['confidence']),
      explanation: _nullableString(json['explanation']),
      userText: _nullableString(json['userText']),
      createdAt:
          DateTime.tryParse((json['createdAt'] ?? '').toString()) ??
          DateTime.fromMillisecondsSinceEpoch(0),
      modalityUsed: (json['modalityUsed'] ?? 'multimodal').toString(),
      modelUsed: (json['modelUsed'] ?? 'gemini-multimodal').toString(),
      responseTimeMs: _toNullableInt(json['responseTimeMs']),
      faceDetected: json['faceDetected'] == true,
    );
  }

  static String? _nullableString(dynamic value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  static int? _toNullableInt(dynamic value) {
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}

class PaginatedHistory {
  const PaginatedHistory({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  final List<HistoryItem> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  bool get hasMore => totalPages == 0 ? false : page < totalPages;

  factory PaginatedHistory.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return PaginatedHistory(
      items: rawItems is List
          ? rawItems
                .whereType<Map>()
                .map((item) => HistoryItem.fromJson(Map.from(item)))
                .toList()
          : const [],
      total: _toInt(json['total']),
      page: _toInt(json['page'], fallback: 1),
      limit: _toInt(json['limit'], fallback: 10),
      totalPages: _toInt(json['totalPages']),
    );
  }

  static int _toInt(dynamic value, {int fallback = 0}) {
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }
}

class HistoryPageRequest {
  const HistoryPageRequest({this.page = 1, this.limit = 10});

  final int page;
  final int limit;

  @override
  bool operator ==(Object other) {
    return other is HistoryPageRequest &&
        other.page == page &&
        other.limit == limit;
  }

  @override
  int get hashCode => Object.hash(page, limit);
}
