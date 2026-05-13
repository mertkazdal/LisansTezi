/// Riverpod providers and manual pagination state for analysis history.
library;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../shared/providers/dio_provider.dart';
import '../../data/history_remote_source.dart';
import '../../data/history_repository.dart';
import '../../domain/history_models.dart';

enum HistoryStatus {
  idle,
  initialLoading,
  refreshing,
  loadingMore,
  success,
  failure,
}

class HistoryState {
  const HistoryState({
    required this.status,
    this.items = const [],
    this.page = 0,
    this.limit = 20,
    this.total = 0,
    this.totalPages = 0,
    this.errorMessage,
  });

  const HistoryState.initial() : this(status: HistoryStatus.idle);

  final HistoryStatus status;
  final List<HistoryItem> items;
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final String? errorMessage;

  bool get isLoading => status == HistoryStatus.initialLoading;

  bool get isRefreshing => status == HistoryStatus.refreshing;

  bool get isLoadingMore => status == HistoryStatus.loadingMore;

  bool get hasMore => totalPages > 0 && page < totalPages;

  bool get isEmpty => items.isEmpty && status == HistoryStatus.success;

  HistoryState copyWith({
    HistoryStatus? status,
    List<HistoryItem>? items,
    int? page,
    int? limit,
    int? total,
    int? totalPages,
    String? errorMessage,
    bool clearError = false,
  }) {
    return HistoryState(
      status: status ?? this.status,
      items: items ?? this.items,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      total: total ?? this.total,
      totalPages: totalPages ?? this.totalPages,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}

final historyRemoteSourceProvider = Provider<HistoryRemoteSource>((ref) {
  return HistoryRemoteSource(ref.watch(dioProvider));
});

final historyRepositoryProvider = Provider<HistoryRepository>((ref) {
  return HistoryRepository(ref.watch(historyRemoteSourceProvider));
});

final historyListProvider =
    StateNotifierProvider<HistoryNotifier, HistoryState>((ref) {
      return HistoryNotifier(ref.watch(historyRepositoryProvider));
    });

final historyProvider =
    FutureProvider.family<PaginatedHistory, HistoryPageRequest>((ref, request) {
      return ref
          .watch(historyRepositoryProvider)
          .getHistory(page: request.page, limit: request.limit);
    });

final historyItemProvider = FutureProvider.family<HistoryItem, String>((
  ref,
  historyId,
) {
  return ref.watch(historyRepositoryProvider).getHistoryItem(historyId);
});

class HistoryNotifier extends StateNotifier<HistoryState> {
  HistoryNotifier(this._repository) : super(const HistoryState.initial());

  final HistoryRepository _repository;

  Future<void> loadInitial() async {
    if (state.isLoading) return;
    state = state.copyWith(
      status: HistoryStatus.initialLoading,
      clearError: true,
    );
    await _loadPage(page: 1, append: false);
  }

  Future<void> refresh() async {
    if (state.isRefreshing) return;
    state = state.copyWith(status: HistoryStatus.refreshing, clearError: true);
    await _loadPage(page: 1, append: false);
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || state.isLoading || !state.hasMore) return;
    state = state.copyWith(status: HistoryStatus.loadingMore, clearError: true);
    await _loadPage(page: state.page + 1, append: true);
  }

  Future<void> _loadPage({required int page, required bool append}) async {
    try {
      final response = await _repository.getHistory(
        page: page,
        limit: state.limit,
      );
      state = state.copyWith(
        status: HistoryStatus.success,
        items: append
            ? _mergeUnique(state.items, response.items)
            : response.items,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        status: HistoryStatus.failure,
        errorMessage: _friendlyError(error),
      );
    }
  }

  String _friendlyError(Object error) {
    final apiError = _extractApiException(error);
    if (apiError == null) return t('historyLoadError');
    return switch (apiError.statusCode) {
      401 => t('historyAuthRequired'),
      _ => apiError.message.isEmpty ? t('historyLoadError') : apiError.message,
    };
  }

  ApiException? _extractApiException(Object error) {
    if (error is ApiException) return error;
    if (error is DioException && error.error is ApiException) {
      return error.error as ApiException;
    }
    return null;
  }

  List<HistoryItem> _mergeUnique(
    List<HistoryItem> current,
    List<HistoryItem> next,
  ) {
    final seen = current.map((item) => item.id).toSet();
    final merged = [...current];
    for (final item in next) {
      if (item.id.isEmpty || seen.contains(item.id)) continue;
      seen.add(item.id);
      merged.add(item);
    }
    return merged;
  }
}
