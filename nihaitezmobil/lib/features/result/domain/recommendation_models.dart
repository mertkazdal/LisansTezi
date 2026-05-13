/// Recommendation and result-detail models returned by result endpoints.
library;

class ResultDetail {
  const ResultDetail({
    this.historyId,
    required this.emotion,
    required this.confidence,
    required this.explanation,
    this.warning,
    required this.modalityUsed,
    required this.modelUsed,
    this.responseTimeMs,
    required this.faceDetected,
    required this.recommendations,
    this.feedback,
    this.raw = const {},
  });

  final String? historyId;
  final String emotion;
  final double confidence;
  final String explanation;
  final String? warning;
  final String modalityUsed;
  final String modelUsed;
  final int? responseTimeMs;
  final bool faceDetected;
  final RecommendationBundle recommendations;
  final Map<String, dynamic>? feedback;
  final Map<String, dynamic> raw;

  factory ResultDetail.fromJson(Map<String, dynamic> json) {
    return ResultDetail(
      historyId: _nullableString(json['historyId']),
      emotion: (json['emotion'] ?? json['detectedEmotion'] ?? 'calm')
          .toString(),
      confidence: _toDouble(json['confidence']),
      explanation: (json['explanation'] ?? '').toString(),
      warning: _nullableString(json['warning']),
      modalityUsed: (json['modalityUsed'] ?? 'multimodal').toString(),
      modelUsed: (json['modelUsed'] ?? 'gemini-multimodal').toString(),
      responseTimeMs: _toNullableInt(json['responseTimeMs']),
      faceDetected: json['faceDetected'] == true,
      recommendations: RecommendationBundle.fromJson(json),
      feedback: _optionalMap(json['feedback']),
      raw: Map<String, dynamic>.from(json),
    );
  }
}

class RecommendationBundle {
  const RecommendationBundle({
    this.music = const [],
    this.movies = const [],
    this.books = const [],
    this.advice = const [],
  });

  final List<MusicRecommendation> music;
  final List<MovieRecommendation> movies;
  final List<BookRecommendation> books;
  final List<AdviceRecommendation> advice;

  bool get isEmpty =>
      music.isEmpty && movies.isEmpty && books.isEmpty && advice.isEmpty;

  factory RecommendationBundle.fromJson(Map<String, dynamic> json) {
    final source = json['recommendations'] is Map<String, dynamic>
        ? json['recommendations'] as Map<String, dynamic>
        : json['recommendations'] is Map
        ? Map<String, dynamic>.from(json['recommendations'] as Map)
        : json;

    return RecommendationBundle(
      music: _list(
        source['music'],
      ).map((item) => MusicRecommendation.fromJson(item)).toList(),
      movies: _list(
        source['movie'] ?? source['movies'],
      ).map((item) => MovieRecommendation.fromJson(item)).toList(),
      books: _list(
        source['book'] ?? source['books'],
      ).map((item) => BookRecommendation.fromJson(item)).toList(),
      advice: _list(
        source['advice'] ?? source['lifeAdvice'],
      ).map((item) => AdviceRecommendation.fromJson(item)).toList(),
    );
  }
}

class MusicRecommendation {
  const MusicRecommendation({
    required this.title,
    required this.artist,
    this.coverUrl,
    this.imageUrl,
    this.externalUrl,
    this.url,
    this.reason,
    this.source,
    this.type,
    this.category,
    this.raw = const {},
  });

  final String title;
  final String artist;
  final String? coverUrl;
  final String? imageUrl;
  final String? externalUrl;
  final String? url;
  final String? reason;
  final String? source;
  final String? type;
  final String? category;
  final Map<String, dynamic> raw;

  factory MusicRecommendation.fromJson(Map<String, dynamic> json) {
    return MusicRecommendation(
      title: (json['title'] ?? 'Bilinmeyen parca').toString(),
      artist: _artistText(json['artist'] ?? json['artists']),
      coverUrl: _nullableString(json['cover_url'] ?? json['coverUrl']),
      imageUrl: _nullableString(json['imageUrl'] ?? json['image']),
      externalUrl: _nullableString(
        json['externalUrl'] ?? json['spotify_url'] ?? json['url'],
      ),
      url: _nullableString(json['url']),
      reason: _nullableString(json['reason']),
      source: _nullableString(json['source']),
      type: _nullableString(json['type']),
      category: _nullableString(json['category']),
      raw: Map<String, dynamic>.from(json),
    );
  }
}

class MovieRecommendation {
  const MovieRecommendation({
    required this.title,
    this.posterUrl,
    this.imageUrl,
    this.overview,
    this.description,
    this.rating,
    this.year,
    this.externalUrl,
    this.url,
    this.reason,
    this.source,
    this.type,
    this.category,
    this.raw = const {},
  });

  final String title;
  final String? posterUrl;
  final String? imageUrl;
  final String? overview;
  final String? description;
  final double? rating;
  final String? year;
  final String? externalUrl;
  final String? url;
  final String? reason;
  final String? source;
  final String? type;
  final String? category;
  final Map<String, dynamic> raw;

  factory MovieRecommendation.fromJson(Map<String, dynamic> json) {
    final releaseDate = json['release_date']?.toString();
    return MovieRecommendation(
      title: (json['title'] ?? 'Bilinmeyen film').toString(),
      posterUrl: _nullableString(json['poster_url'] ?? json['posterUrl']),
      imageUrl: _nullableString(json['imageUrl'] ?? json['poster']),
      overview: _nullableString(json['overview']),
      description: _nullableString(json['description']),
      rating: _toNullableDouble(json['rating'] ?? json['vote_average']),
      year:
          (json['year'] ??
                  (releaseDate != null && releaseDate.length >= 4
                      ? releaseDate.substring(0, 4)
                      : null))
              ?.toString(),
      externalUrl: _nullableString(
        json['externalUrl'] ?? json['tmdb_url'] ?? json['link'],
      ),
      url: _nullableString(json['url']),
      reason: _nullableString(json['reason']),
      source: _nullableString(json['source']),
      type: _nullableString(json['type']),
      category: _nullableString(json['category']),
      raw: Map<String, dynamic>.from(json),
    );
  }
}

class BookRecommendation {
  const BookRecommendation({
    required this.title,
    required this.author,
    this.coverUrl,
    this.imageUrl,
    this.externalUrl,
    this.url,
    this.description,
    this.reason,
    this.source,
    this.type,
    this.category,
    this.raw = const {},
  });

  final String title;
  final String author;
  final String? coverUrl;
  final String? imageUrl;
  final String? externalUrl;
  final String? url;
  final String? description;
  final String? reason;
  final String? source;
  final String? type;
  final String? category;
  final Map<String, dynamic> raw;

  factory BookRecommendation.fromJson(Map<String, dynamic> json) {
    return BookRecommendation(
      title: (json['title'] ?? 'Bilinmeyen kitap').toString(),
      author: _artistText(json['author'] ?? json['authors']),
      coverUrl: _nullableString(json['cover_url'] ?? json['coverUrl']),
      imageUrl: _nullableString(json['imageUrl'] ?? json['thumbnail']),
      externalUrl: _nullableString(
        json['externalUrl'] ?? json['books_url'] ?? json['link'],
      ),
      url: _nullableString(json['url']),
      description: _nullableString(json['description']),
      reason: _nullableString(json['reason']),
      source: _nullableString(json['source']),
      type: _nullableString(json['type']),
      category: _nullableString(json['category']),
      raw: Map<String, dynamic>.from(json),
    );
  }
}

class AdviceRecommendation {
  const AdviceRecommendation({
    required this.id,
    required this.title,
    required this.description,
    this.icon,
    this.externalUrl,
    this.url,
    this.reason,
    this.source,
    this.type,
    this.category,
    this.raw = const {},
  });

  final String id;
  final String title;
  final String description;
  final String? icon;
  final String? externalUrl;
  final String? url;
  final String? reason;
  final String? source;
  final String? type;
  final String? category;
  final Map<String, dynamic> raw;

  factory AdviceRecommendation.fromJson(Map<String, dynamic> json) {
    final title = (json['title'] ?? json['category'] ?? 'Kisa tavsiye')
        .toString();
    return AdviceRecommendation(
      id: (json['id'] ?? title).toString(),
      title: title,
      description: (json['description'] ?? json['text'] ?? '').toString(),
      icon: _nullableString(json['icon']),
      externalUrl: _nullableString(json['externalUrl'] ?? json['link']),
      url: _nullableString(json['url']),
      reason: _nullableString(json['reason']),
      source: _nullableString(json['source']),
      type: _nullableString(json['type']),
      category: _nullableString(json['category']),
      raw: Map<String, dynamic>.from(json),
    );
  }
}

List<Map<String, dynamic>> _list(dynamic value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList();
}

String _artistText(dynamic value) {
  if (value is List) return value.join(', ');
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? 'Bilinmeyen' : text;
}

String? _nullableString(dynamic value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

double _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

double? _toNullableDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int? _toNullableInt(dynamic value) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

Map<String, dynamic>? _optionalMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return null;
}
