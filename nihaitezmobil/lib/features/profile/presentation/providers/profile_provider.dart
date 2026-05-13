/// Riverpod providers for user profile state.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/dio_provider.dart';
import '../../data/profile_remote_source.dart';
import '../../data/profile_repository.dart';
import '../../domain/profile_models.dart';

final profileRemoteSourceProvider = Provider<ProfileRemoteSource>((ref) {
  return ProfileRemoteSource(ref.watch(dioProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(profileRemoteSourceProvider));
});

final profileProvider = FutureProvider<ProfileModel>((ref) {
  return ref.watch(profileRepositoryProvider).getProfile();
});
