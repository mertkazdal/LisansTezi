/// Riverpod providers for network connectivity state.
library;

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final connectivityProvider = Provider<Connectivity>((ref) {
  return Connectivity();
});

final connectivityStreamProvider = StreamProvider<List<ConnectivityResult>>((
  ref,
) {
  return ref.watch(connectivityProvider).onConnectivityChanged;
});

final isOfflineProvider = Provider<bool>((ref) {
  return ref
      .watch(connectivityStreamProvider)
      .maybeWhen(
        data: (results) =>
            results.isEmpty || results.contains(ConnectivityResult.none),
        orElse: () => false,
      );
});
