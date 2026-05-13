/// Riverpod providers for DioClient and the raw Dio instance.
library;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/dio_client.dart';
import 'storage_provider.dart';

final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient(
    secureStorage: ref.watch(secureStorageServiceProvider),
    preferences: ref.watch(preferencesServiceProvider),
  );
});

final dioProvider = Provider<Dio>((ref) {
  return ref.watch(dioClientProvider).dio;
});
