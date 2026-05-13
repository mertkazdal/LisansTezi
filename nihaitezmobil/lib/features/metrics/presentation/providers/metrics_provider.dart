/// Riverpod providers and state notifier for the admin metrics dashboard.
library;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../shared/providers/dio_provider.dart';
import '../../data/metrics_remote_source.dart';
import '../../data/metrics_repository.dart';
import '../../domain/metrics_models.dart';

enum MetricsStatus {
  idle,
  loading,
  success,
  empty,
  failure,
  unauthorized,
  forbidden,
}

class MetricsState {
  const MetricsState({required this.status, this.bundle, this.errorMessage});

  const MetricsState.idle() : this(status: MetricsStatus.idle);

  const MetricsState.loading({MetricsBundle? bundle})
    : this(status: MetricsStatus.loading, bundle: bundle);

  const MetricsState.success(MetricsBundle bundle)
    : this(status: MetricsStatus.success, bundle: bundle);

  const MetricsState.empty(MetricsBundle bundle)
    : this(status: MetricsStatus.empty, bundle: bundle);

  const MetricsState.failure(String message)
    : this(status: MetricsStatus.failure, errorMessage: message);

  const MetricsState.unauthorized(String message)
    : this(status: MetricsStatus.unauthorized, errorMessage: message);

  const MetricsState.forbidden(String message)
    : this(status: MetricsStatus.forbidden, errorMessage: message);

  final MetricsStatus status;
  final MetricsBundle? bundle;
  final String? errorMessage;

  bool get isLoading => status == MetricsStatus.loading;
}

final metricsRemoteSourceProvider = Provider<MetricsRemoteSource>((ref) {
  return MetricsRemoteSource(ref.watch(dioProvider));
});

final metricsRepositoryProvider = Provider<MetricsRepository>((ref) {
  return MetricsRepository(ref.watch(metricsRemoteSourceProvider));
});

final metricsProvider =
    StateNotifierProvider.autoDispose<MetricsNotifier, MetricsState>((ref) {
      return MetricsNotifier(ref.watch(metricsRepositoryProvider));
    });

class MetricsNotifier extends StateNotifier<MetricsState> {
  MetricsNotifier(this._repository) : super(const MetricsState.idle());

  final MetricsRepository _repository;

  Future<void> load() async {
    state = MetricsState.loading(bundle: state.bundle);
    try {
      final bundle = await _repository.getMetricsBundle();
      state = bundle.hasUsableData
          ? MetricsState.success(bundle)
          : MetricsState.empty(bundle);
    } catch (error) {
      final statusCode = _statusCode(error);
      final message = _friendlyError(error);
      state = switch (statusCode) {
        401 => MetricsState.unauthorized(message),
        403 => MetricsState.forbidden(message),
        _ => MetricsState.failure(message),
      };
    }
  }

  String _friendlyError(Object error) {
    final statusCode = _statusCode(error);
    if (statusCode == 401) return t('metricsLoginRequired');
    if (statusCode == 403) return t('metricsUnauthorizedBody');

    final apiError = _extractApiException(error);
    return switch (apiError?.code) {
      'NETWORK_ERROR' => t('networkError'),
      'TIMEOUT_ERROR' => t('timeoutError'),
      _ =>
        apiError?.message.isNotEmpty == true
            ? apiError!.message
            : t('metricsLoadErrorBody'),
    };
  }

  int? _statusCode(Object error) {
    if (error is ApiException) return error.statusCode;
    if (error is DioException) {
      final apiError = _extractApiException(error);
      return apiError?.statusCode ?? error.response?.statusCode;
    }
    return null;
  }

  ApiException? _extractApiException(Object error) {
    if (error is ApiException) return error;
    if (error is DioException && error.error is ApiException) {
      return error.error as ApiException;
    }
    return null;
  }
}
