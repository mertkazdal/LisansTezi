/// Riverpod auth providers and notifier for session lifecycle.
library;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../shared/providers/dio_provider.dart';
import '../../../../shared/providers/storage_provider.dart';
import '../../data/auth_remote_source.dart';
import '../../data/auth_repository.dart';
import '../../domain/auth_state.dart';

final authRemoteSourceProvider = Provider<AuthRemoteSource>((ref) {
  return AuthRemoteSource(ref.watch(dioProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    remoteSource: ref.watch(authRemoteSourceProvider),
    secureStorage: ref.watch(secureStorageServiceProvider),
    preferences: ref.watch(preferencesServiceProvider),
  );
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository) : super(const AuthState.unknown());

  final AuthRepository _repository;

  Future<void> restoreSession() async {
    state = AuthState.loading(user: state.user, token: state.token);
    try {
      state = await _repository.restoreSession();
    } catch (error) {
      state = AuthState.unauthenticated(errorMessage: _friendlyError(error));
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = AuthState.loading(user: state.user, token: state.token);
    try {
      state = await _repository.login(email: email, password: password);
    } catch (error) {
      state = AuthState.unauthenticated(errorMessage: _friendlyError(error));
    }
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
  }) async {
    state = AuthState.loading(user: state.user, token: state.token);
    try {
      state = await _repository.register(
        username: username,
        email: email,
        password: password,
      );
    } catch (error) {
      state = AuthState.unauthenticated(errorMessage: _friendlyError(error));
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }

  String _friendlyError(Object error) {
    final apiError = _extractApiException(error);
    if (apiError == null) {
      return t('unexpectedAuthError');
    }

    return switch (apiError.code) {
      'AUTH_PAYLOAD_INVALID' => t('sessionMissing'),
      'NETWORK_ERROR' => t('networkError'),
      'TIMEOUT_ERROR' => t('timeoutError'),
      _ => _messageFromBackend(apiError.message),
    };
  }

  ApiException? _extractApiException(Object error) {
    if (error is ApiException) return error;
    if (error is DioException && error.error is ApiException) {
      return error.error as ApiException;
    }
    return null;
  }

  String _messageFromBackend(String message) {
    return switch (message) {
      'Email and password are required.' => t('emailPasswordRequired'),
      'Invalid email or password.' => t('invalidCredentials'),
      'Username must be at least 3 characters.' => t('usernameTooShort'),
      'Please provide a valid email address.' => t('invalidEmail'),
      'Password must be at least 6 characters.' => t('passwordTooShort'),
      'An account with this email already exists.' => t('emailAlreadyExists'),
      'This username is already taken.' => t('usernameTaken'),
      _ => message.isEmpty ? t('unexpectedAuthError') : message,
    };
  }
}
