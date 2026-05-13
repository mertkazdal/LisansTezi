/// Authenticated MoodLens user model aligned with the backend AuthResponse.
library;

class UserModel {
  const UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.isAdmin,
  });

  final String id;
  final String username;
  final String email;
  final String role;
  final bool isAdmin;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] ?? json['userId'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'user').toString(),
      isAdmin: json['isAdmin'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
      'isAdmin': isAdmin,
    };
  }

  UserModel copyWith({
    String? id,
    String? username,
    String? email,
    String? role,
    bool? isAdmin,
  }) {
    return UserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      role: role ?? this.role,
      isAdmin: isAdmin ?? this.isAdmin,
    );
  }
}
