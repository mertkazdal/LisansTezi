/// Login screen connected to the backend auth endpoint.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../shared/providers/storage_provider.dart';
import 'providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, required this.from});

  final String from;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    await ref
        .read(authProvider.notifier)
        .login(
          email: _emailController.text,
          password: _passwordController.text,
        );
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: isError ? AppColors.error : AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        _showMessage(_authSuccessMessage(next, fallbackKey: 'loginSuccess'));
        context.go(widget.from);
        return;
      }

      final didFailAfterSubmit =
          previous?.isLoading == true && next.isUnauthenticated;
      if (didFailAfterSubmit && next.errorMessage != null) {
        _showMessage(next.errorMessage!, isError: true);
      }
    });

    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;
    final guestRemaining = ref.watch(guestRemainingAnalysesProvider);
    final guestUsed = (AppConstants.guestAnalysisLimit - guestRemaining).clamp(
      0,
      AppConstants.guestAnalysisLimit,
    );
    final hasGuestContext = guestUsed > 0;
    final returnLabel = _returnLabel(widget.from);

    return Scaffold(
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: GlassmorphismCard(
                padding: const EdgeInsets.all(22),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.psychology,
                        color: AppColors.primary,
                        size: 46,
                      ),
                      const SizedBox(height: 14),
                      Text(t('authLoginEyebrow'), textAlign: TextAlign.center),
                      const SizedBox(height: 8),
                      Text(
                        t('authLoginTitle'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t('authLoginDescription'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _ReturnTargetCard(
                        returnLabel: returnLabel,
                        guestUsed: guestUsed,
                        hasGuestContext: hasGuestContext,
                      ),
                      const SizedBox(height: 16),
                      const _AuthTrustCopy(
                        keys: [
                          'authTrustPrivate',
                          'authTrustGuestMerge',
                          'authTrustHistory',
                        ],
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        controller: _emailController,
                        enabled: !isLoading,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        decoration: InputDecoration(
                          labelText: t('email'),
                          hintText: t('emailHint'),
                          prefixIcon: const Icon(Icons.alternate_email),
                        ),
                        validator: (value) => Validators.email(
                          value,
                          errorMsg: value == null || value.trim().isEmpty
                              ? t('emailRequired')
                              : t('invalidEmail'),
                        ),
                      ),
                      const SizedBox(height: 14),
                      _GuestMergeHint(
                        guestUsed: guestUsed,
                        hasGuestContext: hasGuestContext,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _passwordController,
                        enabled: !isLoading,
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        onFieldSubmitted: (_) => _submit(),
                        decoration: InputDecoration(
                          labelText: t('password'),
                          hintText: t('passwordHint'),
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                        validator: (value) => Validators.password(
                          value,
                          errorMsg: value == null || value.trim().isEmpty
                              ? t('passwordRequired')
                              : t('passwordTooShort'),
                        ),
                      ),
                      const SizedBox(height: 22),
                      PremiumButton(
                        text: t('login'),
                        icon: Icons.login,
                        isLoading: isLoading,
                        onPressed: isLoading ? null : _submit,
                      ),
                      const SizedBox(height: 12),
                      PremiumButton(
                        text: t('continueAsGuest'),
                        icon: Icons.person_outline,
                        isSecondary: true,
                        onPressed: isLoading ? null : () => context.go('/'),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Flexible(child: Text(t('newMemberPrompt'))),
                          TextButton(
                            onPressed: isLoading
                                ? null
                                : () => context.go(
                                    '/register?from=${Uri.encodeComponent(widget.from)}',
                                  ),
                            child: Text(t('register')),
                          ),
                        ],
                      ),
                      Text(
                        t('guestHint'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _returnLabel(String path) {
    if (path.startsWith('/history')) return t('authReturnHistory');
    if (path.startsWith('/profile')) return t('authReturnProfile');
    if (path.startsWith('/result')) return t('authReturnResult');
    if (path == '/') return t('authReturnHome');
    return t('authReturnAnalyze');
  }

  String _authSuccessMessage(dynamic state, {required String fallbackKey}) {
    if (state.guestDataMerged == true) {
      return t(
        'guestMergeSuccess',
      ).replaceAll('{count}', '${state.migratedGuestAnalysesCount}');
    }
    return t(fallbackKey);
  }
}

class _AuthTrustCopy extends StatelessWidget {
  const _AuthTrustCopy({required this.keys});

  final List<String> keys;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.46),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            for (final key in keys) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.check_circle_outline,
                    color: AppColors.success,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      t(key),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              if (key != keys.last) const SizedBox(height: 8),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReturnTargetCard extends StatelessWidget {
  const _ReturnTargetCard({
    required this.returnLabel,
    required this.guestUsed,
    required this.hasGuestContext,
  });

  final String returnLabel;
  final int guestUsed;
  final bool hasGuestContext;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              t('authReturnTarget'),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.primaryLight,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(returnLabel, style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 4),
            Text(
              hasGuestContext
                  ? t('authGuestReady').replaceAll('{count}', '$guestUsed')
                  : t('authSecureStudioReturn'),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuestMergeHint extends StatelessWidget {
  const _GuestMergeHint({
    required this.guestUsed,
    required this.hasGuestContext,
  });

  final int guestUsed;
  final bool hasGuestContext;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.48),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: '${t('authGuestMergeTitle')} ',
                style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w800,
                ),
              ),
              TextSpan(
                text: hasGuestContext
                    ? t(
                        'authGuestMergeUsed',
                      ).replaceAll('{count}', '$guestUsed')
                    : t('authGuestMergeEmpty'),
              ),
            ],
          ),
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}
