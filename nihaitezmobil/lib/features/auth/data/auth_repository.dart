/// Auth repository coordinating remote auth calls and secure local session.
library;

import '../../../core/network/api_exception.dart';
import '../../../core/storage/preferences_service.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../domain/auth_state.dart';
import '../domain/user_model.dart';
import 'auth_remote_source.dart';

class AuthRepository {
  AuthRepository({
    required AuthRemoteSource remoteSource,
    required SecureStorageService secureStorage,
    required PreferencesService preferences,
  }) : _remoteSource = remoteSource,
       _secureStorage = secureStorage,
       _preferences = preferences;

  final AuthRemoteSource _remoteSource;
  final SecureStorageService _secureStorage;
  final PreferencesService _preferences;

  Future<AuthState> restoreSession() async {
    final token = await _secureStorage.getToken();
    final user = await _secureStorage.getUser();
    if (token == null || token.isEmpty || user == null) {
      return const AuthState.unauthenticated();
    }
    return AuthState.authenticated(user: user, token: token);
  }

  Future<AuthState> login({
    required String email,
    required String password,
  }) async {
    final payload = await _remoteSource.login(
      email: email,
      password: password,
      guestSessionId: _preferences.getGuestSessionId(),
    );
    return _persistAuthPayload(payload);
  }

  Future<AuthState> register({
    required String username,
    required String email,
    required String password,
  }) async {
    final payload = await _remoteSource.register(
      username: username,
      email: email,
      password: password,
      guestSessionId: _preferences.getGuestSessionId(),
    );
    return _persistAuthPayload(payload);
  }

  Future<void> logout() async {
    await _secureStorage.deleteToken();
    await _secureStorage.deleteUser();
    await _preferences.resetGuestQuotaState();
  }

  Future<AuthState> _persistAuthPayload(Map<String, dynamic> payload) async {
    final token = (payload['token'] ?? '').toString();
    final user = UserModel.fromJson(payload);
    if (token.isEmpty || user.id.isEmpty) {
      throw ApiException(
        message: 'Auth payload is invalid.',
        code: 'AUTH_PAYLOAD_INVALID',
      );
    }

    await _secureStorage.saveToken(token);
    await _secureStorage.saveUser(user);
    await _preferences.clearGuestSessionId();

    return AuthState.authenticated(
      user: user,
      token: token,
      guestDataMerged: payload['guestDataMerged'] == true,
      migratedGuestAnalysesCount:
          (payload['migratedGuestAnalysesCount'] as num?)?.toInt() ?? 0,
    );
  }
}
