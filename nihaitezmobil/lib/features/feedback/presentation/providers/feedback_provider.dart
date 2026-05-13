/// Riverpod providers for analysis feedback state.
library;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../shared/providers/dio_provider.dart';
import '../../../../shared/providers/storage_provider.dart';
import '../../data/feedback_remote_source.dart';
import '../../data/feedback_repository.dart';
import '../../domain/feedback_models.dart';

enum FeedbackStatus {
  idle,
  loading,
  submitting,
  success,
  alreadySubmitted,
  failure,
}

class FeedbackState {
  const FeedbackState({required this.status, this.feedback, this.errorMessage});

  const FeedbackState.initial() : this(status: FeedbackStatus.idle);

  final FeedbackStatus status;
  final FeedbackResponse? feedback;
  final String? errorMessage;

  bool get isLoading => status == FeedbackStatus.loading;

  bool get isSubmitting => status == FeedbackStatus.submitting;

  bool get hasFeedback => feedback != null;

  FeedbackState copyWith({
    FeedbackStatus? status,
    FeedbackResponse? feedback,
    String? errorMessage,
    bool clearError = false,
  }) {
    return FeedbackState(
      status: status ?? this.status,
      feedback: feedback ?? this.feedback,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}

final feedbackRemoteSourceProvider = Provider<FeedbackRemoteSource>((ref) {
  return FeedbackRemoteSource(ref.watch(dioProvider));
});

final feedbackRepositoryProvider = Provider<FeedbackRepository>((ref) {
  return FeedbackRepository(
    remoteSource: ref.watch(feedbackRemoteSourceProvider),
    preferences: ref.watch(preferencesServiceProvider),
  );
});

final feedbackProvider =
    StateNotifierProvider.family<FeedbackNotifier, FeedbackState, String>((
      ref,
      historyId,
    ) {
      return FeedbackNotifier(
        historyId: historyId,
        repository: ref.watch(feedbackRepositoryProvider),
      );
    });

class FeedbackNotifier extends StateNotifier<FeedbackState> {
  FeedbackNotifier({
    required String historyId,
    required FeedbackRepository repository,
  }) : _historyId = historyId,
       _repository = repository,
       super(const FeedbackState.initial());

  final String _historyId;
  final FeedbackRepository _repository;

  Future<void> load() async {
    if (state.isLoading || state.hasFeedback) return;
    state = state.copyWith(status: FeedbackStatus.loading, clearError: true);
    try {
      final feedback = await _repository.getFeedback(_historyId);
      state = FeedbackState(status: FeedbackStatus.success, feedback: feedback);
    } catch (error) {
      state = state.copyWith(
        status: FeedbackStatus.failure,
        errorMessage: _friendlyError(error),
      );
    }
  }

  Future<void> submit(FeedbackRequest request) async {
    if (state.hasFeedback) {
      state = state.copyWith(
        status: FeedbackStatus.alreadySubmitted,
        errorMessage: t('feedbackAlreadySubmitted'),
      );
      return;
    }

    state = state.copyWith(status: FeedbackStatus.submitting, clearError: true);
    try {
      final feedback = await _repository.submitFeedback(
        historyId: _historyId,
        request: request,
      );
      state = FeedbackState(status: FeedbackStatus.success, feedback: feedback);
    } catch (error) {
      state = state.copyWith(
        status: FeedbackStatus.failure,
        errorMessage: _friendlyError(error),
      );
    }
  }

  String _friendlyError(Object error) {
    final apiError = _extractApiException(error);
    if (apiError == null) return t('feedbackSubmitError');
    return switch (apiError.code) {
      'INVALID_RATING_RANGE' => t('feedbackInvalidRating'),
      'NETWORK_ERROR' => t('networkError'),
      'TIMEOUT_ERROR' => t('timeoutError'),
      _ =>
        apiError.message.isEmpty ? t('feedbackSubmitError') : apiError.message,
    };
  }

  ApiException? _extractApiException(Object error) {
    if (error is ApiException) return error;
    if (error is DioException && error.error is ApiException) {
      return error.error as ApiException;
    }
    return null;
  }
}
