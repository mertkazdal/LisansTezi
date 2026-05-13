/// Riverpod provider set for emotion analysis and media input state.
library;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../shared/providers/dio_provider.dart';
import '../../../../shared/providers/storage_provider.dart';
import '../../data/analyze_remote_source.dart';
import '../../data/analyze_repository.dart';
import '../../data/image_input_service.dart';
import '../../domain/analysis_models.dart';

enum AnalyzeStatus { idle, pickingImage, ready, loading, success, failure }

class AnalyzeState {
  const AnalyzeState({
    required this.status,
    this.selectedImage,
    this.result,
    this.errorMessage,
    this.guestRemainingAnalyses,
  });

  AnalyzeState.initial({required int guestRemainingAnalyses})
    : this(
        status: AnalyzeStatus.idle,
        guestRemainingAnalyses: guestRemainingAnalyses,
      );

  final AnalyzeStatus status;
  final AnalysisImageInput? selectedImage;
  final AnalysisResult? result;
  final String? errorMessage;
  final int? guestRemainingAnalyses;

  bool get isLoading => status == AnalyzeStatus.loading;

  bool get isPickingImage => status == AnalyzeStatus.pickingImage;

  bool get hasSelectedImage => selectedImage != null;

  bool get hasResult => result != null;

  bool get requiresFollowUp => result?.asksForReason == true;

  AnalyzeState copyWith({
    AnalyzeStatus? status,
    AnalysisImageInput? selectedImage,
    bool clearImage = false,
    AnalysisResult? result,
    bool clearResult = false,
    String? errorMessage,
    bool clearError = false,
    int? guestRemainingAnalyses,
  }) {
    return AnalyzeState(
      status: status ?? this.status,
      selectedImage: clearImage ? null : selectedImage ?? this.selectedImage,
      result: clearResult ? null : result ?? this.result,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      guestRemainingAnalyses:
          guestRemainingAnalyses ?? this.guestRemainingAnalyses,
    );
  }
}

final imagePickerProvider = Provider<ImagePicker>((ref) {
  return ImagePicker();
});

final imageInputServiceProvider = Provider<ImageInputService>((ref) {
  return ImageInputService(ref.watch(imagePickerProvider));
});

final analyzeRemoteSourceProvider = Provider<AnalyzeRemoteSource>((ref) {
  return AnalyzeRemoteSource(ref.watch(dioProvider));
});

final analyzeRepositoryProvider = Provider<AnalyzeRepository>((ref) {
  return AnalyzeRepository(
    remoteSource: ref.watch(analyzeRemoteSourceProvider),
    preferences: ref.watch(preferencesServiceProvider),
  );
});

final analyzeProvider = StateNotifierProvider<AnalyzeNotifier, AnalyzeState>((
  ref,
) {
  final repository = ref.watch(analyzeRepositoryProvider);
  return AnalyzeNotifier(
    ref: ref,
    repository: repository,
    imageInputService: ref.watch(imageInputServiceProvider),
  );
});

class AnalyzeNotifier extends StateNotifier<AnalyzeState> {
  AnalyzeNotifier({
    required Ref ref,
    required AnalyzeRepository repository,
    required ImageInputService imageInputService,
  }) : _repository = repository,
       _ref = ref,
       _imageInputService = imageInputService,
       super(
         AnalyzeState.initial(
           guestRemainingAnalyses: repository.getGuestRemainingAnalyses(),
         ),
       );

  final AnalyzeRepository _repository;
  final Ref _ref;
  final ImageInputService _imageInputService;

  Future<void> pickGalleryImage() async {
    await _pickImage(_imageInputService.pickFromGallery);
  }

  Future<void> takePhoto() async {
    await _pickImage(_imageInputService.takePhoto);
  }

  Future<void> analyze({String? text}) async {
    state = state.copyWith(
      status: AnalyzeStatus.loading,
      clearError: true,
      clearResult: true,
    );

    try {
      final result = await _repository.analyze(
        text: text,
        image: state.selectedImage,
      );
      state = state.copyWith(
        status: AnalyzeStatus.success,
        result: result,
        guestRemainingAnalyses:
            result.guestRemainingAnalyses ?? state.guestRemainingAnalyses,
        clearError: true,
      );
      _syncGuestRemaining(result.guestRemainingAnalyses);
    } catch (error) {
      final quota = _quotaFromError(error);
      state = state.copyWith(
        status: AnalyzeStatus.failure,
        errorMessage: _friendlyError(error),
        guestRemainingAnalyses: quota,
      );
      _syncGuestRemaining(quota);
    }
  }

  Future<void> followUp({required String text}) async {
    state = state.copyWith(status: AnalyzeStatus.loading, clearError: true);
    try {
      final result = await _repository.analyze(text: text);
      state = state.copyWith(
        status: AnalyzeStatus.success,
        result: result,
        guestRemainingAnalyses:
            result.guestRemainingAnalyses ?? state.guestRemainingAnalyses,
        clearError: true,
      );
      _syncGuestRemaining(result.guestRemainingAnalyses);
    } catch (error) {
      final quota = _quotaFromError(error);
      state = state.copyWith(
        status: AnalyzeStatus.failure,
        errorMessage: _friendlyError(error),
        guestRemainingAnalyses: quota,
      );
      _syncGuestRemaining(quota);
    }
  }

  void clearImage() {
    state = state.copyWith(
      status: AnalyzeStatus.ready,
      clearImage: true,
      clearError: true,
    );
  }

  void reset({bool keepResult = false}) {
    state = AnalyzeState.initial(
      guestRemainingAnalyses: _repository.getGuestRemainingAnalyses(),
    ).copyWith(result: keepResult ? state.result : null);
  }

  Future<void> _pickImage(Future<AnalysisImageInput?> Function() picker) async {
    state = state.copyWith(
      status: AnalyzeStatus.pickingImage,
      clearError: true,
    );
    try {
      final image = await picker();
      state = state.copyWith(
        status: image == null ? AnalyzeStatus.idle : AnalyzeStatus.ready,
        selectedImage: image,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        status: AnalyzeStatus.failure,
        errorMessage: _friendlyError(error),
      );
    }
  }

  String _friendlyError(Object error) {
    final apiError = _extractApiException(error);
    if (apiError == null) return t('analysisUnexpectedError');

    return switch (apiError.code) {
      'GUEST_SESSION_REQUIRED' => t('guestSessionRequired'),
      'GUEST_QUOTA_EXCEEDED' => t('guestQuotaExceeded'),
      'ANALYSIS_INPUT_REQUIRED' => t('analysisInputRequired'),
      'UNSUPPORTED_IMAGE_MIME_TYPE' => t('unsupportedImageFormat'),
      'IMAGE_TOO_LARGE' => t('imageTooLarge'),
      'IMAGE_INPUT_FAILED' => t('imageInputFailed'),
      'NETWORK_ERROR' => t('networkError'),
      'TIMEOUT_ERROR' => t('timeoutError'),
      _ =>
        apiError.message.isEmpty
            ? t('analysisUnexpectedError')
            : apiError.message,
    };
  }

  int? _quotaFromError(Object error) {
    final apiError = _extractApiException(error);
    final details = apiError?.details;
    if (apiError?.code == 'GUEST_QUOTA_EXCEEDED') return 0;
    if (details is Map && details['guestRemainingAnalyses'] is num) {
      return (details['guestRemainingAnalyses'] as num).toInt();
    }
    return state.guestRemainingAnalyses;
  }

  void _syncGuestRemaining(int? value) {
    if (value == null) return;
    _ref.invalidate(guestRemainingAnalysesProvider);
  }

  ApiException? _extractApiException(Object error) {
    if (error is ApiException) return error;
    if (error is DioException && error.error is ApiException) {
      return error.error as ApiException;
    }
    return null;
  }
}
