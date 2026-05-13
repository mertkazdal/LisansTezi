/// Repository for analysis feedback reads and submissions.
library;

import '../../../core/storage/preferences_service.dart';
import '../domain/feedback_models.dart';
import 'feedback_remote_source.dart';

class FeedbackRepository {
  FeedbackRepository({
    required FeedbackRemoteSource remoteSource,
    required PreferencesService preferences,
  }) : _remoteSource = remoteSource,
       _preferences = preferences;

  final FeedbackRemoteSource _remoteSource;
  final PreferencesService _preferences;

  Future<FeedbackResponse?> getFeedback(String historyId) {
    return _remoteSource.getFeedback(
      historyId: historyId,
      guestSessionId: _preferences.getGuestSessionId(),
    );
  }

  Future<FeedbackResponse> submitFeedback({
    required String historyId,
    required FeedbackRequest request,
  }) {
    return _remoteSource.submitFeedback(
      historyId: historyId,
      guestSessionId: _preferences.getGuestSessionId(),
      request: request,
    );
  }
}
