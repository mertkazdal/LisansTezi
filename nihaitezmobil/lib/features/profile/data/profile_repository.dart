/// Repository for profile and account-management workflows.
library;

import '../domain/profile_models.dart';
import 'profile_remote_source.dart';

class ProfileRepository {
  ProfileRepository(this._remoteSource);

  final ProfileRemoteSource _remoteSource;

  Future<ProfileModel> getProfile() {
    return _remoteSource.getProfile();
  }

  Future<AccountDeletionResult> deleteAccount({
    String confirmationText = 'DELETE',
  }) {
    return _remoteSource.deleteAccount(confirmationText: confirmationText);
  }
}
