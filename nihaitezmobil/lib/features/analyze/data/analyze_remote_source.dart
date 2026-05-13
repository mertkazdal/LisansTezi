/// Remote data source for the /api/analyze endpoint.
library;

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/analysis_models.dart';

class AnalyzeRemoteSource {
  AnalyzeRemoteSource(this._dio);

  final Dio _dio;

  Future<AnalysisResult> analyze(AnalyzeRequest request) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiConstants.analyze,
      data: request.toJson(),
      options: Options(extra: {'skipAuthClear': true}),
    );
    return AnalysisResult.fromJson(response.data ?? <String, dynamic>{});
  }
}
