/// Register screen connected to the backend auth endpoint.
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

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key, required this.from});

  final String from;

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordConfirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscurePasswordConfirm = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _passwordConfirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    await ref
        .read(authProvider.notifier)
        .register(
          username: _usernameController.text,
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
        _showMessage(_authSuccessMessage(next, fallbackKey: 'registerSuccess'));
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
                        Icons.auto_awesome,
                        color: AppColors.primary,
                        size: 46,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        t('authRegisterEyebrow'),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t('authRegisterTitle'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t('authRegisterDescription'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _RegisterBenefits(guestUsed: guestUsed),
                      const SizedBox(height: 12),
                      _GuestTrialCard(
                        guestLimit: AppConstants.guestAnalysisLimit,
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        controller: _usernameController,
                        enabled: !isLoading,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.username],
                        decoration: InputDecoration(
                          labelText: t('username'),
                          hintText: t('usernameHint'),
                          prefixIcon: const Icon(Icons.person_outline),
                        ),
                        validator: (value) => Validators.username(
                          value,
                          errorMsg: value == null || value.trim().isEmpty
                              ? t('usernameRequired')
                              : t('usernameTooShort'),
                        ),
                      ),
                      const SizedBox(height: 14),
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
                      TextFormField(
                        controller: _passwordController,
                        enabled: !isLoading,
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.newPassword],
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
                      const SizedBox(height: 10),
                      ValueListenableBuilder<TextEditingValue>(
                        valueListenable: _passwordController,
                        builder: (context, value, _) {
                          return _PasswordStrength(password: value.text);
                        },
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _passwordConfirmController,
                        enabled: !isLoading,
                        obscureText: _obscurePasswordConfirm,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.newPassword],
                        onFieldSubmitted: (_) => _submit(),
                        decoration: InputDecoration(
                          labelText: t('passwordConfirm'),
                          hintText: t('passwordConfirmHint'),
                          prefixIcon: const Icon(Icons.lock_reset_outlined),
                          suffixIcon: IconButton(
                            onPressed: () {
                              setState(() {
                                _obscurePasswordConfirm =
                                    !_obscurePasswordConfirm;
                              });
                            },
                            icon: Icon(
                              _obscurePasswordConfirm
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                        validator: (value) {
                          final text = value ?? '';
                          if (text.isEmpty) return t('passwordConfirmRequired');
                          if (text != _passwordController.text) {
                            return t('passwordsDoNotMatch');
                          }
                          return null;
                        },
                      ),
                      ValueListenableBuilder<TextEditingValue>(
                        valueListenable: _passwordConfirmController,
                        builder: (context, value, _) {
                          if (value.text.isEmpty ||
                              value.text != _passwordController.text) {
                            return const SizedBox.shrink();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              t('passwordMatch'),
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.success),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 14),
                      Text(
                        t('authRegisterPrivacy'),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 22),
                      PremiumButton(
                        text: t('register'),
                        icon: Icons.person_add_alt_1,
                        isLoading: isLoading,
                        onPressed: isLoading ? null : _submit,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Flexible(child: Text(t('alreadyMemberPrompt'))),
                          TextButton(
                            onPressed: isLoading
                                ? null
                                : () => context.go(
                                    '/login?from=${Uri.encodeComponent(widget.from)}',
                                  ),
                            child: Text(t('login')),
                          ),
                        ],
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

  String _authSuccessMessage(dynamic state, {required String fallbackKey}) {
    if (state.guestDataMerged == true) {
      return t(
        'guestMergeSuccess',
      ).replaceAll('{count}', '${state.migratedGuestAnalysesCount}');
    }
    return t(fallbackKey);
  }
}

class _RegisterBenefits extends StatelessWidget {
  const _RegisterBenefits({required this.guestUsed});

  final int guestUsed;

  @override
  Widget build(BuildContext context) {
    final benefits = [
      t('authRegisterBenefitHistory'),
      t('authRegisterBenefitRecommendations'),
      t('authRegisterBenefitFeedback'),
      t('authRegisterBenefitDelete'),
    ];

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.46),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (var index = 0; index < benefits.length; index++) ...[
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
                      benefits[index],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              if (index == 0 && guestUsed > 0) ...[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 26),
                  child: Text(
                    t(
                      'authRegisterGuestReady',
                    ).replaceAll('{count}', '$guestUsed'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.primaryLight,
                    ),
                  ),
                ),
              ],
              if (index != benefits.length - 1) const SizedBox(height: 8),
            ],
          ],
        ),
      ),
    );
  }
}

class _GuestTrialCard extends StatelessWidget {
  const _GuestTrialCard({required this.guestLimit});

  final int guestLimit;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              t('authRegisterTrialTitle').replaceAll('{limit}', '$guestLimit'),
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: AppColors.warning,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              t('authRegisterTrialDescription'),
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

class _PasswordStrength extends StatelessWidget {
  const _PasswordStrength({required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final score = _score(password);
    final label = score >= 0.75
        ? t('passwordStrengthStrong')
        : score >= 0.45
        ? t('passwordStrengthMedium')
        : t('passwordStrengthWeak');
    final color = score >= 0.75
        ? AppColors.success
        : score >= 0.45
        ? AppColors.warning
        : AppColors.error;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: password.isEmpty ? 0 : score,
            minHeight: 6,
            color: color,
            backgroundColor: AppColors.card,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }

  double _score(String value) {
    var score = 0.0;
    if (value.length >= 6) score += 0.25;
    if (value.length >= 10) score += 0.2;
    if (RegExp(r'[A-Z]').hasMatch(value) && RegExp(r'[a-z]').hasMatch(value)) {
      score += 0.25;
    }
    if (RegExp(r'[0-9]').hasMatch(value)) score += 0.15;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(value)) score += 0.15;
    return score.clamp(0, 1).toDouble();
  }
}
