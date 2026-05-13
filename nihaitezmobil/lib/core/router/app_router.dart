/// GoRouter route map for the mobile shell and top-level flows.
library;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/analyze/presentation/analyze_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/history/presentation/history_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/metrics/presentation/metrics_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/result/presentation/result_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../../widgets/bottom_nav_shell.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> shellNavigatorKey = GlobalKey<NavigatorState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) {
        return LoginScreen(from: _authReturnTarget(state));
      },
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) {
        return RegisterScreen(from: _authReturnTarget(state));
      },
    ),
    GoRoute(
      path: '/result/:historyId',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) {
        return ResultScreen(historyId: state.pathParameters['historyId']!);
      },
    ),
    GoRoute(
      path: '/settings',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) => const SettingsScreen(),
    ),
    ShellRoute(
      navigatorKey: shellNavigatorKey,
      builder: (context, state, child) => BottomNavShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(
          path: '/analyze',
          builder: (context, state) => const AnalyzeScreen(),
        ),
        GoRoute(
          path: '/history',
          builder: (context, state) => const HistoryScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/metrics',
          builder: (context, state) => const MetricsScreen(),
        ),
      ],
    ),
  ],
);

String _authReturnTarget(GoRouterState state) {
  final from = state.uri.queryParameters['from']?.trim();
  if (from == null || from.isEmpty || !from.startsWith('/')) {
    return '/analyze';
  }
  if (from.startsWith('/login') || from.startsWith('/register')) {
    return '/analyze';
  }
  return from;
}
