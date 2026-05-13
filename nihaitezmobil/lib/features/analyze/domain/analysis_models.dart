/// Domain models for emotion analysis requests, selected media, and results.
library;

import 'dart:typed_data';

import '../../result/domain/recommendation_models.dart';

class AnalyzeRequest {
  const AnalyzeRequest({
    this.text,
    this.imageBase64,
    this.mimeType,
    this.guestSessionId,
  });

  final String? text;
  final String? imageBase64;
  final String? mimeType;
  final String? guestSessionId;

  Map<String, dynamic> toJson() {
    return {
      'text': text?.trim(),
      'imageBase64': imageBase64,
      'mimeType': mimeType,
      'guestSessionId': guestSessionId,
    }..removeWhere((_, value) {
      return value == null || (value is String && value.trim().isEmpty);
    });
  }
}

class AnalysisImageInput {
  const AnalysisImageInput({
    required this.fileName,
    required this.mimeType,
    required this.base64Data,
    required this.bytes,
  });

  final String fileName;
  final String mimeType;
  final String base64Data;
  final Uint8List bytes;

  int get byteLength => bytes.lengthInBytes;
}

class AnalysisResult {
  const AnalysisResult({
    this.historyId,
    required this.emotion,
    required this.confidence,
    required this.explanation,
    required this.needsReason,
    required this.reasonProvided,
    this.followUpQuestion,
    this.warning,
    required this.modalityUsed,
    required this.modelUsed,
    this.responseTimeMs,
    required this.faceDetected,
    this.guestRemainingAnalyses,
    this.recommendations = const RecommendationBundle(),
    this.feedback,
    this.raw = const {},
  });

  final String? historyId;
  final String emotion;
  final double confidence;
  final String explanation;
  final bool needsReason;
  final bool reasonProvided;
  final String? followUpQuestion;
  final String? warning;
  final String modalityUsed;
  final String modelUsed;
  final int? responseTimeMs;
  final bool faceDetected;
  final int? guestRemainingAnalyses;
  final RecommendationBundle recommendations;
  final Map<String, dynamic>? feedback;
  final Map<String, dynamic> raw;

  bool get hasWarning => warning != null && warning!.trim().isNotEmpty;

  bool get asksForReason =>
      needsReason && (followUpQuestion?.trim().isNotEmpty ?? false);

  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    return AnalysisResult(
      historyId: json['historyId']?.toString(),
      emotion: (json['emotion'] ?? 'calm').toString(),
      confidence: _toDouble(json['confidence']),
      explanation: (json['explanation'] ?? '').toString(),
      needsReason: json['needsReason'] == true,
      reasonProvided: json['reasonProvided'] != false,
      followUpQuestion: _nullableString(json['followUpQuestion']),
      warning: _nullableString(json['warning']),
      modalityUsed: (json['modalityUsed'] ?? 'multimodal').toString(),
      modelUsed: (json['modelUsed'] ?? 'gemini-multimodal').toString(),
      responseTimeMs: _toNullableInt(json['responseTimeMs']),
      faceDetected: json['faceDetected'] == true,
      guestRemainingAnalyses: _toNullableInt(json['guestRemainingAnalyses']),
      recommendations: RecommendationBundle.fromJson(json),
      feedback: _optionalMap(json['feedback']),
      raw: Map<String, dynamic>.from(json),
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

  static Map<String, dynamic>? _optionalMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, item) => MapEntry(key.toString(), item));
    }
    return null;
  }
}
