/// Riverpod-friendly authentication state for login, register, and restore.
library;

import 'user_model.dart';

enum AuthStatus { unknown, loading, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.token,
    this.errorMessage,
    this.guestDataMerged = false,
    this.migratedGuestAnalysesCount = 0,
  });

  const AuthState.unknown() : this(status: AuthStatus.unknown);

  const AuthState.loading({UserModel? user, String? token})
    : this(status: AuthStatus.loading, user: user, token: token);

  const AuthState.authenticated({
    required UserModel user,
    required String token,
    bool guestDataMerged = false,
    int migratedGuestAnalysesCount = 0,
  }) : this(
         status: AuthStatus.authenticated,
         user: user,
         token: token,
         guestDataMerged: guestDataMerged,
         migratedGuestAnalysesCount: migratedGuestAnalysesCount,
       );

  const AuthState.unauthenticated({String? errorMessage})
    : this(status: AuthStatus.unauthenticated, errorMessage: errorMessage);

  final AuthStatus status;
  final UserModel? user;
  final String? token;
  final String? errorMessage;
  final bool guestDataMerged;
  final int migratedGuestAnalysesCount;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  bool get isLoading => status == AuthStatus.loading;

  bool get isUnauthenticated => status == AuthStatus.unauthenticated;

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? token,
    String? errorMessage,
    bool? guestDataMerged,
    int? migratedGuestAnalysesCount,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      token: token ?? this.token,
      errorMessage: errorMessage,
      guestDataMerged: guestDataMerged ?? this.guestDataMerged,
      migratedGuestAnalysesCount:
          migratedGuestAnalysesCount ?? this.migratedGuestAnalysesCount,
    );
  }
}
