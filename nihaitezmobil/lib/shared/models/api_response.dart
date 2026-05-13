/// Generic API response wrapper for repositories that need typed decoding.
library;

class ApiResponse<T> {
  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.code,
  });

  final bool success;
  final T? data;
  final String? message;
  final String? code;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json)? decodeData,
  ) {
    return ApiResponse<T>(
      success: json['success'] == true || json['error'] == null,
      data: decodeData == null ? json['data'] as T? : decodeData(json['data']),
      message: (json['message'] ?? json['detail']) as String?,
      code: json['code'] as String?,
    );
  }
}
