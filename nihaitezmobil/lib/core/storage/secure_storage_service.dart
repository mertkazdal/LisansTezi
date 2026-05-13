/// Secure storage service for JWT token and authenticated user data.
library;

import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/domain/user_model.dart';
import '../constants/app_constants.dart';

class SecureStorageService {
  SecureStorageService()
    : _storage = const FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
        iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
      );

  final FlutterSecureStorage _storage;

  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return _storage.read(key: AppConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: AppConstants.tokenKey);
  }

  Future<void> saveUser(UserModel user) async {
    await saveUserJson(user.toJson());
  }

  Future<UserModel?> getUser() async {
    final json = await getUserJson();
    return json == null ? null : UserModel.fromJson(json);
  }

  Future<void> saveUserJson(Map<String, dynamic> userJson) async {
    await _storage.write(
      key: AppConstants.userKey,
      value: jsonEncode(userJson),
    );
  }

  Future<Map<String, dynamic>?> getUserJson() async {
    final value = await _storage.read(key: AppConstants.userKey);
    if (value == null || value.isEmpty) return null;

    try {
      return jsonDecode(value) as Map<String, dynamic>;
    } on FormatException {
      return null;
    }
  }

  Future<void> deleteUser() async {
    await _storage.delete(key: AppConstants.userKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
