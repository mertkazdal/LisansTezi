/// Animated offline banner for top-level screens.
library;

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../i18n/app_localizations.dart';
import '../theme/app_colors.dart';

class NetworkStatusBanner extends StatefulWidget {
  const NetworkStatusBanner({super.key});

  @override
  State<NetworkStatusBanner> createState() => _NetworkStatusBannerState();
}

class _NetworkStatusBannerState extends State<NetworkStatusBanner> {
  bool _isOffline = false;
  late final Stream<List<ConnectivityResult>> _connectivityStream;

  @override
  void initState() {
    super.initState();
    _connectivityStream = Connectivity().onConnectivityChanged;
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<ConnectivityResult>>(
      stream: _connectivityStream,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          final results = snapshot.data!;
          final isCurrentlyOffline =
              results.contains(ConnectivityResult.none) || results.isEmpty;

          if (isCurrentlyOffline != _isOffline) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _isOffline = isCurrentlyOffline);
            });
          }
        }

        if (!_isOffline) return const SizedBox.shrink();

        return Container(
          width: double.infinity,
          color: AppColors.error,
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 8,
            bottom: 8,
          ),
          child: Text(
            t('networkOffline'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ).animate().slideY(
          begin: -1,
          end: 0,
          duration: 300.ms,
          curve: Curves.easeOut,
        );
      },
    );
  }
}
