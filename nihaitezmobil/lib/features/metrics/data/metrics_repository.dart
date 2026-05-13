/// Repository that composes the metrics dashboard from admin endpoints.
library;

import '../domain/metrics_models.dart';
import 'metrics_remote_source.dart';

class MetricsRepository {
  MetricsRepository(this._remoteSource);

  final MetricsRemoteSource _remoteSource;

  Future<MetricsBundle> getMetricsBundle() async {
    final dashboard = await _remoteSource.getDashboard();
    final emotionDistribution = await _safeLoad(
      _remoteSource.getEmotionDistribution,
      const <EmotionDistributionPoint>[],
    );
    final responseTimes = await _safeLoad(
      _remoteSource.getResponseTimes,
      ResponseTimeSummary.empty,
    );
    final research = await _safeLoad(
      _remoteSource.getResearch,
      <String, dynamic>{},
    );
    final comparison = await _safeLoad(
      _remoteSource.getComparison,
      <String, dynamic>{},
    );
    final adminOverview = await _safeLoad(
      _remoteSource.getAdminOverview,
      <String, dynamic>{},
    );

    return MetricsBundle(
      dashboard: dashboard,
      emotionDistribution: emotionDistribution,
      responseTimes: responseTimes,
      research: research,
      comparison: comparison,
      adminOverview: adminOverview,
    );
  }

  Future<T> _safeLoad<T>(Future<T> Function() loader, T fallback) async {
    try {
      return await loader();
    } catch (_) {
      return fallback;
    }
  }
}
