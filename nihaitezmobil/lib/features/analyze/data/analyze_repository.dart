/// Repository for emotion analysis flows.
library;

import '../../../core/storage/preferences_service.dart';
import '../domain/analysis_models.dart';
import 'analyze_remote_source.dart';

class AnalyzeRepository {
  AnalyzeRepository({
    required AnalyzeRemoteSource remoteSource,
    required PreferencesService preferences,
  }) : _remoteSource = remoteSource,
       _preferences = preferences;

  final AnalyzeRemoteSource _remoteSource;
  final PreferencesService _preferences;

  int getGuestRemainingAnalyses() {
    return _preferences.getGuestRemainingAnalyses();
  }

  Future<AnalysisResult> analyze({
    String? text,
    AnalysisImageInput? image,
  }) async {
    final result = await _remoteSource.analyze(
      AnalyzeRequest(
        text: text,
        imageBase64: image?.base64Data,
        mimeType: image?.mimeType,
        guestSessionId: _preferences.getGuestSessionId(),
      ),
    );

    if (result.guestRemainingAnalyses != null) {
      await _preferences.setGuestRemainingAnalyses(
        result.guestRemainingAnalyses!,
      );
    }

    return result;
  }
}
