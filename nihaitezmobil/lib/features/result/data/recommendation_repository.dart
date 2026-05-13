/// Repository for result recommendations.
library;

import '../../../core/storage/preferences_service.dart';
import '../domain/recommendation_models.dart';
import 'recommendation_remote_source.dart';

class RecommendationRepository {
  RecommendationRepository({
    required RecommendationRemoteSource remoteSource,
    required PreferencesService preferences,
  }) : _remoteSource = remoteSource,
       _preferences = preferences;

  final RecommendationRemoteSource _remoteSource;
  final PreferencesService _preferences;

  Future<RecommendationBundle> getRecommendations(String historyId) {
    return _remoteSource.getRecommendations(
      historyId: historyId,
      guestSessionId: _preferences.getGuestSessionId(),
    );
  }

  Future<ResultDetail> getResultDetail(String historyId) {
    return _remoteSource.getResultDetail(
      historyId: historyId,
      guestSessionId: _preferences.getGuestSessionId(),
    );
  }
}
