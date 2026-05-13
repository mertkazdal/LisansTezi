/// Repository for emotion analysis history.
library;

import '../domain/history_models.dart';
import 'history_remote_source.dart';

class HistoryRepository {
  HistoryRepository(this._remoteSource);

  final HistoryRemoteSource _remoteSource;

  Future<PaginatedHistory> getHistory({int page = 1, int limit = 10}) {
    return _remoteSource.getHistory(page: page, limit: limit);
  }

  Future<HistoryItem> getHistoryItem(String id) {
    return _remoteSource.getHistoryItem(id);
  }
}
