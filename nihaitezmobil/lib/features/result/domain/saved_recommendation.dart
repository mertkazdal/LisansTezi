/// Local saved recommendation model matching the web saved-items behavior.
library;

class SavedRecommendation {
  const SavedRecommendation({
    required this.id,
    required this.type,
    required this.title,
    this.subtitle,
    this.reason,
    this.imageUrl,
    this.externalUrl,
    this.emotion,
    this.sourceHistoryId,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String? subtitle;
  final String? reason;
  final String? imageUrl;
  final String? externalUrl;
  final String? emotion;
  final String? sourceHistoryId;
  final DateTime createdAt;

  factory SavedRecommendation.fromJson(Map<String, dynamic> json) {
    final createdAtValue = json['createdAt'] ?? json['savedAt'];
    return SavedRecommendation(
      id: (json['id'] ?? '').toString(),
      type: (json['type'] ?? json['category'] ?? 'advice').toString(),
      title: (json['title'] ?? '').toString(),
      subtitle: _nullableString(json['subtitle']),
      reason: _nullableString(json['reason']),
      imageUrl: _nullableString(
        json['imageUrl'] ??
            json['coverUrl'] ??
            json['posterUrl'] ??
            json['cover'] ??
            json['poster'],
      ),
      externalUrl: _nullableString(json['externalUrl'] ?? json['url']),
      emotion: _nullableString(json['emotion']),
      sourceHistoryId: _nullableString(
        json['sourceHistoryId'] ?? json['historyId'],
      ),
      createdAt:
          DateTime.tryParse((createdAtValue ?? '').toString()) ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'subtitle': subtitle,
      'reason': reason,
      'imageUrl': imageUrl,
      'externalUrl': externalUrl,
      'emotion': emotion,
      'sourceHistoryId': sourceHistoryId,
      'createdAt': createdAt.toIso8601String(),
      'savedAt': createdAt.toIso8601String(),
    }..removeWhere((_, value) => value == null);
  }
}

String createSavedRecommendationId({
  required String type,
  required String title,
  String? subtitle,
  String? sourceHistoryId,
}) {
  return [
    type,
    sourceHistoryId ?? 'local',
    _slug(title),
    if (subtitle != null && subtitle.trim().isNotEmpty) _slug(subtitle),
  ].join(':');
}

String _slug(String value) {
  const replacements = {
    '\u00e7': 'c',
    '\u00c7': 'c',
    '\u011f': 'g',
    '\u011e': 'g',
    '\u0131': 'i',
    '\u0130': 'i',
    '\u00f6': 'o',
    '\u00d6': 'o',
    '\u015f': 's',
    '\u015e': 's',
    '\u00fc': 'u',
    '\u00dc': 'u',
  };

  var normalized = value.trim().toLowerCase();
  for (final entry in replacements.entries) {
    normalized = normalized.replaceAll(entry.key, entry.value);
  }
  return normalized
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
}

String? _nullableString(dynamic value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}
