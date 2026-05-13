/// User profile model returned by the backend profile endpoint.
library;

class ProfileModel {
  const ProfileModel({
    required this.id,
    required this.username,
    required this.email,
    this.avatarUrl,
    this.createdAt,
    required this.totalAnalyses,
    required this.feedbackCount,
    this.mostFrequentEmotion,
    required this.role,
    required this.isAdmin,
    required this.canDeleteAccount,
    required this.deleteConfirmationText,
  });

  final String id;
  final String username;
  final String email;
  final String? avatarUrl;
  final DateTime? createdAt;
  final int totalAnalyses;
  final int feedbackCount;
  final String? mostFrequentEmotion;
  final String role;
  final bool isAdmin;
  final bool canDeleteAccount;
  final String deleteConfirmationText;

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: (json['id'] ?? json['userId'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()),
      totalAnalyses: _toInt(json['totalAnalyses']),
      feedbackCount: _toInt(
        json['feedbackCount'] ??
            json['feedbacksCount'] ??
            json['totalFeedback'],
      ),
      mostFrequentEmotion: json['mostFrequentEmotion']?.toString(),
      role: (json['role'] ?? 'user').toString(),
      isAdmin: json['isAdmin'] == true,
      canDeleteAccount: json['canDeleteAccount'] != false,
      deleteConfirmationText: (json['deleteConfirmationText'] ?? 'DELETE')
          .toString(),
    );
  }
}

int _toInt(dynamic value) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

class AccountDeletionResult {
  const AccountDeletionResult({
    required this.message,
    required this.deletedAnalyses,
    required this.deletedRecommendations,
  });

  final String message;
  final int deletedAnalyses;
  final int deletedRecommendations;

  factory AccountDeletionResult.fromJson(Map<String, dynamic> json) {
    return AccountDeletionResult(
      message: (json['message'] ?? '').toString(),
      deletedAnalyses: _toInt(json['deletedAnalyses']),
      deletedRecommendations: _toInt(json['deletedRecommendations']),
    );
  }
}
