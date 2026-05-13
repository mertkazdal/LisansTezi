/// Riverpod providers for result and recommendation detail.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/dio_provider.dart';
import '../../../../shared/providers/storage_provider.dart';
import '../../data/recommendation_remote_source.dart';
import '../../data/recommendation_repository.dart';
import '../../domain/recommendation_models.dart';

final recommendationRemoteSourceProvider = Provider<RecommendationRemoteSource>(
  (ref) {
    return RecommendationRemoteSource(ref.watch(dioProvider));
  },
);

final recommendationRepositoryProvider = Provider<RecommendationRepository>((
  ref,
) {
  return RecommendationRepository(
    remoteSource: ref.watch(recommendationRemoteSourceProvider),
    preferences: ref.watch(preferencesServiceProvider),
  );
});

final recommendationsProvider =
    FutureProvider.family<RecommendationBundle, String>((ref, historyId) {
      return ref
          .watch(recommendationRepositoryProvider)
          .getRecommendations(historyId);
    });

final resultDetailProvider = FutureProvider.family<ResultDetail, String>((
  ref,
  historyId,
) {
  return ref.watch(recommendationRepositoryProvider).getResultDetail(historyId);
});
