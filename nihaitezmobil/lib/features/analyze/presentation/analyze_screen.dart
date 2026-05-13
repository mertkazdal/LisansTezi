/// Web-canonical analysis studio adapted to one-handed mobile use.
library;

import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../../core/widgets/animated_loading.dart';
import '../../../core/widgets/glassmorphism_card.dart';
import '../../../core/widgets/premium_button.dart';
import '../../../shared/providers/storage_provider.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import 'providers/analyze_provider.dart';

enum _AnalysisMode { empty, text, image, multimodal }

class AnalyzeScreen extends ConsumerStatefulWidget {
  const AnalyzeScreen({super.key});

  @override
  ConsumerState<AnalyzeScreen> createState() => _AnalyzeScreenState();
}

class _AnalyzeScreenState extends ConsumerState<AnalyzeScreen> {
  final _textController = TextEditingController();
  final _followUpController = TextEditingController();
  final _random = Random();
  bool _visualConsent = false;
  int _examplePulse = 0;

  @override
  void initState() {
    super.initState();
    _textController.addListener(_refreshInputState);
  }

  @override
  void dispose() {
    _textController
      ..removeListener(_refreshInputState)
      ..dispose();
    _followUpController.dispose();
    super.dispose();
  }

  void _refreshInputState() {
    setState(() {});
  }

  Future<void> _submit() async {
    final analyzeState = ref.read(analyzeProvider);
    final authState = ref.read(authProvider);
    final text = _textController.text.trim();
    final int guestRemaining =
        analyzeState.guestRemainingAnalyses ??
        ref.read(guestRemainingAnalysesProvider);
    final guestLocked = !authState.isAuthenticated && guestRemaining <= 0;

    if (guestLocked) {
      _openLogin();
      return;
    }

    if (text.isEmpty && !analyzeState.hasSelectedImage) {
      _showMessage(t('analyzeReadinessMissingInput'));
      return;
    }

    if (analyzeState.hasSelectedImage && !_visualConsent) {
      _showMessage(t('analyzeReadinessMissingConsent'));
      return;
    }

    FocusScope.of(context).unfocus();
    await ref.read(analyzeProvider.notifier).analyze(text: text);
  }

  Future<void> _submitFollowUp() async {
    final text = _followUpController.text.trim();
    if (text.isEmpty) return;
    FocusScope.of(context).unfocus();
    await ref.read(analyzeProvider.notifier).followUp(text: text);
    _followUpController.clear();
  }

  void _fillExampleText() {
    final examples = [
      t('analyzeExample1'),
      t('analyzeExample2'),
      t('analyzeExample3'),
    ];
    final next = examples[_random.nextInt(examples.length)];
    _textController.value = TextEditingValue(
      text: next,
      selection: TextSelection.collapsed(offset: next.length),
    );
    setState(() => _examplePulse++);
  }

  Future<void> _pickGalleryImage() async {
    setState(() => _visualConsent = false);
    await ref.read(analyzeProvider.notifier).pickGalleryImage();
  }

  Future<void> _takePhoto() async {
    setState(() => _visualConsent = false);
    await ref.read(analyzeProvider.notifier).takePhoto();
  }

  void _clearImage() {
    setState(() => _visualConsent = false);
    ref.read(analyzeProvider.notifier).clearImage();
  }

  void _openLogin() {
    context.go('/login?from=${Uri.encodeComponent('/analyze')}');
  }

  void _openRegister() {
    context.go('/register?from=${Uri.encodeComponent('/analyze')}');
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(analyzeProvider, (previous, next) {
      if (next.status == AnalyzeStatus.failure && next.errorMessage != null) {
        _showMessage(next.errorMessage!);
      }

      final result = next.result;
      final previousHistoryId = previous?.result?.historyId;
      if (next.status == AnalyzeStatus.success &&
          result != null &&
          !next.requiresFollowUp &&
          result.historyId != null &&
          result.historyId != previousHistoryId) {
        context.go('/result/${result.historyId}');
      }
    });

    final analyzeState = ref.watch(analyzeProvider);
    final authState = ref.watch(authProvider);
    final storedGuestRemaining = ref.watch(guestRemainingAnalysesProvider);
    final guestRemaining =
        analyzeState.guestRemainingAnalyses ?? storedGuestRemaining;
    final isBusy = analyzeState.isLoading || analyzeState.isPickingImage;
    final hasText = _textController.text.trim().isNotEmpty;
    final hasImage = analyzeState.hasSelectedImage;
    final mode = _analysisMode(hasText: hasText, hasImage: hasImage);
    final modeMeta = _modeMeta(mode);
    final guestLocked = !authState.isAuthenticated && guestRemaining <= 0;
    final hasInput = hasText || hasImage;
    final visualReady = !hasImage || _visualConsent;
    final canSubmit = hasInput && visualReady && !guestLocked && !isBusy;
    final readinessItems = _readinessItems(
      hasText: hasText,
      hasImage: hasImage,
      visualConsent: _visualConsent,
      guestLocked: guestLocked,
      isAuthenticated: authState.isAuthenticated,
      guestRemaining: guestRemaining,
      contextStrength: _contextStrength(_textController.text.trim().length),
    );
    final readinessMessage = _readinessMessage(
      hasText: hasText,
      hasImage: hasImage,
      visualConsent: _visualConsent,
      guestLocked: guestLocked,
      mode: mode,
    );

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(title: Text(t('analyzeTitle'))),
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: Stack(
            children: [
              Column(
                children: [
                  Expanded(
                    child: ListView(
                      keyboardDismissBehavior:
                          ScrollViewKeyboardDismissBehavior.onDrag,
                      padding: const EdgeInsets.fromLTRB(18, 12, 18, 20),
                      children: [
                        _AnalyzeHero(modeMeta: modeMeta)
                            .animate()
                            .fadeIn(duration: 420.ms)
                            .slideY(begin: 0.08, end: 0),
                        const SizedBox(height: 14),
                        _GuestQuotaPanel(
                          isAuthenticated: authState.isAuthenticated,
                          remaining: guestRemaining,
                          guestLocked: guestLocked,
                          onLogin: _openLogin,
                          onRegister: _openRegister,
                        ),
                        const SizedBox(height: 14),
                        _ComposerPanel(
                          controller: _textController,
                          isBusy: isBusy,
                          examplePulse: _examplePulse,
                          onExample: _fillExampleText,
                        ),
                        const SizedBox(height: 14),
                        _ModeCards(activeMode: mode),
                        const SizedBox(height: 14),
                        _ImagePanel(
                          state: analyzeState,
                          isBusy: isBusy,
                          onPickGallery: _pickGalleryImage,
                          onTakePhoto: _takePhoto,
                          onClearImage: _clearImage,
                        ),
                        if (hasImage) ...[
                          const SizedBox(height: 14),
                          _ConsentCard(
                            value: _visualConsent,
                            isBusy: isBusy,
                            onChanged: (value) {
                              setState(() => _visualConsent = value);
                            },
                          ),
                        ],
                        const SizedBox(height: 14),
                        _ReadinessChecklist(items: readinessItems),
                        if (analyzeState.errorMessage != null) ...[
                          const SizedBox(height: 14),
                          _ErrorPanel(
                            message: analyzeState.errorMessage!,
                            guestLocked: guestLocked,
                            onLogin: _openLogin,
                            onRegister: _openRegister,
                          ),
                        ],
                        if (analyzeState.result?.hasWarning == true) ...[
                          const SizedBox(height: 14),
                          _WarningBanner(
                            message: analyzeState.result!.warning!,
                          ),
                        ],
                        if (analyzeState.requiresFollowUp &&
                            analyzeState.result?.followUpQuestion != null) ...[
                          const SizedBox(height: 14),
                          _FollowUpCard(
                            controller: _followUpController,
                            isBusy: isBusy,
                            question: analyzeState.result!.followUpQuestion!,
                            onSubmit: _submitFollowUp,
                          ),
                        ],
                        const SizedBox(height: 22),
                      ],
                    ),
                  ),
                  _StickyActionBar(
                    canSubmit: canSubmit,
                    isBusy: isBusy,
                    guestLocked: guestLocked,
                    readinessMessage: readinessMessage,
                    onAnalyze: _submit,
                    onLogin: _openLogin,
                  ),
                ],
              ),
              if (analyzeState.isLoading) _LoadingOverlay(modeMeta: modeMeta),
            ],
          ),
        ),
      ),
    );
  }

  List<_ReadinessItem> _readinessItems({
    required bool hasText,
    required bool hasImage,
    required bool visualConsent,
    required bool guestLocked,
    required bool isAuthenticated,
    required int guestRemaining,
    required _ContextStrength contextStrength,
  }) {
    return [
      _ReadinessItem(
        icon: Icons.notes_rounded,
        label: t('analyzeChecklistTextLabel'),
        done: hasText,
        hint: hasText
            ? _format('analyzeChecklistTextReady', {
                'strength': contextStrength.label,
              })
            : t('analyzeChecklistTextHint'),
      ),
      _ReadinessItem(
        icon: Icons.face_retouching_natural_rounded,
        label: t('analyzeChecklistImageLabel'),
        done: hasImage,
        hint: hasImage
            ? t('analyzeChecklistImageReady')
            : t('analyzeChecklistImageHint'),
      ),
      _ReadinessItem(
        icon: Icons.privacy_tip_rounded,
        label: t('analyzeChecklistConsentLabel'),
        done: !hasImage || visualConsent,
        hint: hasImage
            ? visualConsent
                  ? t('analyzeChecklistConsentReady')
                  : t('analyzeChecklistConsentHint')
            : t('analyzeChecklistConsentOptional'),
      ),
      _ReadinessItem(
        icon: isAuthenticated
            ? Icons.verified_user_rounded
            : Icons.hourglass_bottom_rounded,
        label: isAuthenticated
            ? t('analyzeChecklistAccountLabel')
            : t('analyzeChecklistGuestLabel'),
        done: isAuthenticated || !guestLocked,
        hint: isAuthenticated
            ? t('analyzeChecklistAccountHint')
            : guestLocked
            ? t('analyzeChecklistLockedHint')
            : _format('analyzeChecklistRemainingHint', {
                'count': guestRemaining,
              }),
      ),
    ];
  }
}

class _AnalyzeHero extends StatelessWidget {
  const _AnalyzeHero({required this.modeMeta});

  final _ModeMeta modeMeta;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Eyebrow(text: t('analyzeHeroEyebrow')),
          const SizedBox(height: 14),
          Text(
            t('analyzeHeroTitle'),
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(
            t('analyzeHeroGradient'),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppColors.primaryLight,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            t('analyzeHeroDescription'),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: _panelDecoration(
              AppColors.primary.withValues(alpha: 0.08),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _PulseOrb(icon: modeMeta.icon),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('analyzeHeroSignalTitle'),
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        modeMeta.summary,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _SignalChip(label: t('analyzeHeroTextSignal')),
              _SignalChip(label: t('analyzeHeroImageSignal')),
              _SignalChip(label: t('analyzeHeroRecommendationSignal')),
            ],
          ),
        ],
      ),
    );
  }
}

class _GuestQuotaPanel extends StatelessWidget {
  const _GuestQuotaPanel({
    required this.isAuthenticated,
    required this.remaining,
    required this.guestLocked,
    required this.onLogin,
    required this.onRegister,
  });

  final bool isAuthenticated;
  final int remaining;
  final bool guestLocked;
  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final limit = AppConstants.guestAnalysisLimit;
    final progress = isAuthenticated
        ? 1.0
        : (remaining / limit).clamp(0.0, 1.0).toDouble();
    final title = isAuthenticated
        ? t('analyzeQuotaAccountTitle')
        : guestLocked
        ? t('analyzeQuotaLockedTitle')
        : t('analyzeQuotaGuestTitle');
    final body = isAuthenticated
        ? t('analyzeQuotaAccountBody')
        : guestLocked
        ? t('analyzeQuotaLockedBody')
        : _format('analyzeQuotaGuestBody', {
            'remaining': remaining,
            'limit': limit,
          });

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      borderColor: guestLocked
          ? AppColors.warning.withValues(alpha: 0.45)
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                isAuthenticated
                    ? Icons.verified_user_rounded
                    : guestLocked
                    ? Icons.lock_rounded
                    : Icons.bolt_rounded,
                color: isAuthenticated
                    ? AppColors.success
                    : guestLocked
                    ? AppColors.warning
                    : AppColors.primaryLight,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      body,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                isAuthenticated ? t('commonUnlimited') : '$remaining/$limit',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: isAuthenticated
                      ? AppColors.success
                      : AppColors.primaryLight,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 8,
              value: progress,
              backgroundColor: AppColors.border.withValues(alpha: 0.45),
              valueColor: AlwaysStoppedAnimation<Color>(
                guestLocked ? AppColors.warning : AppColors.primaryLight,
              ),
            ),
          ),
          if (guestLocked) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: PremiumButton(
                    text: t('login'),
                    icon: Icons.login_rounded,
                    onPressed: onLogin,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: PremiumButton(
                    text: t('register'),
                    icon: Icons.person_add_alt_rounded,
                    isSecondary: true,
                    onPressed: onRegister,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _ComposerPanel extends StatelessWidget {
  const _ComposerPanel({
    required this.controller,
    required this.isBusy,
    required this.examplePulse,
    required this.onExample,
  });

  final TextEditingController controller;
  final bool isBusy;
  final int examplePulse;
  final VoidCallback onExample;

  @override
  Widget build(BuildContext context) {
    final strength = _contextStrength(controller.text.trim().length);
    final progress = (controller.text.length / 1000).clamp(0.0, 1.0);

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Eyebrow(text: t('analyzeComposerEyebrow')),
                    const SizedBox(height: 10),
                    Text(
                      t('analyzeComposerTitle'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('analyzeComposerDescription'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              _StrengthBadge(strength: strength),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            key: ValueKey(examplePulse),
            controller: controller,
            enabled: !isBusy,
            minLines: 5,
            maxLines: 8,
            maxLength: 1000,
            textInputAction: TextInputAction.newline,
            decoration: InputDecoration(
              labelText: t('analysisTextLabel'),
              hintText: t('analysisTextHint'),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: isBusy ? null : onExample,
                icon: const Icon(Icons.auto_fix_high_rounded),
                label: Text(t('analyzeExampleButton')),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _format('analyzeCharacterCount', {
                        'count': controller.text.length,
                      }),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(height: 5),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        minHeight: 5,
                        value: progress,
                        backgroundColor: AppColors.border.withValues(
                          alpha: 0.45,
                        ),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          strength.color,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ModeCards extends StatelessWidget {
  const _ModeCards({required this.activeMode});

  final _AnalysisMode activeMode;

  @override
  Widget build(BuildContext context) {
    final modes = [
      _modeMeta(_AnalysisMode.text),
      _modeMeta(_AnalysisMode.image),
      _modeMeta(_AnalysisMode.multimodal),
    ];

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Eyebrow(text: t('analyzeModeEyebrow')),
                    const SizedBox(height: 10),
                    Text(
                      t('analyzeModeTitle'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('analyzeModeDescription'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              _ModeStatePill(isLive: activeMode != _AnalysisMode.empty),
            ],
          ),
          const SizedBox(height: 14),
          for (final mode in modes) ...[
            _ModeCard(meta: mode, active: mode.mode == activeMode),
            if (mode != modes.last) const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({required this.meta, required this.active});

  final _ModeMeta meta;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: AppConstants.animNormal,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: active
            ? AppColors.primary.withValues(alpha: 0.12)
            : AppColors.card.withValues(alpha: 0.28),
        border: Border.all(
          color: active
              ? AppColors.primaryLight.withValues(alpha: 0.55)
              : AppColors.border.withValues(alpha: 0.55),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(meta.icon, color: active ? AppColors.primaryLight : null),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        meta.label,
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                    ),
                    Text(
                      meta.marker,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textTertiary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  meta.description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ImagePanel extends StatelessWidget {
  const _ImagePanel({
    required this.state,
    required this.isBusy,
    required this.onPickGallery,
    required this.onTakePhoto,
    required this.onClearImage,
  });

  final AnalyzeState state;
  final bool isBusy;
  final VoidCallback onPickGallery;
  final VoidCallback onTakePhoto;
  final VoidCallback onClearImage;

  @override
  Widget build(BuildContext context) {
    final image = state.selectedImage;

    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Eyebrow(text: t('analyzeImageEyebrow')),
          const SizedBox(height: 10),
          Text(
            t('analyzeImageTitle'),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 6),
          Text(
            t('analyzeImageDescription'),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          if (image == null)
            _EmptyScanner(
              isBusy: isBusy,
              onPickGallery: onPickGallery,
              onTakePhoto: onTakePhoto,
            )
          else
            _SelectedScannerPreview(state: state, onClearImage: onClearImage),
        ],
      ),
    );
  }
}

class _EmptyScanner extends StatelessWidget {
  const _EmptyScanner({
    required this.isBusy,
    required this.onPickGallery,
    required this.onTakePhoto,
  });

  final bool isBusy;
  final VoidCallback onPickGallery;
  final VoidCallback onTakePhoto;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _scannerDecoration(),
      child: Column(
        children: [
          SizedBox(
            height: 132,
            child: Stack(
              children: [
                const Positioned.fill(child: _CornerFrame()),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.center_focus_strong_rounded,
                        size: 36,
                        color: AppColors.primaryLight,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        t('analyzeImageDropTitle'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        t('analyzeImageDropDescription'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const Positioned.fill(child: _ScanLine(subtle: true)),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isBusy ? null : onPickGallery,
                  icon: const Icon(Icons.photo_library_outlined),
                  label: Text(t('analyzePickGallery')),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isBusy ? null : onTakePhoto,
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: Text(t('analyzeOpenCamera')),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            t('analyzeSupportedFormats'),
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textTertiary),
          ),
        ],
      ),
    );
  }
}

class _SelectedScannerPreview extends StatelessWidget {
  const _SelectedScannerPreview({
    required this.state,
    required this.onClearImage,
  });

  final AnalyzeState state;
  final VoidCallback onClearImage;

  @override
  Widget build(BuildContext context) {
    final image = state.selectedImage!;
    final sizeMb = image.byteLength / (1024 * 1024);

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Image.memory(image.bytes, fit: BoxFit.cover),
          ),
          const Positioned.fill(child: _ScanLine()),
          const Positioned.fill(child: _CornerFrame()),
          Positioned(
            left: 10,
            bottom: 10,
            right: 56,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: AppColors.scrim,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      t('analyzeImageReady'),
                      style: Theme.of(
                        context,
                      ).textTheme.labelLarge?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _format('analyzeFileMeta', {
                        'mime': image.mimeType,
                        'size': sizeMb.toStringAsFixed(1),
                      }),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(
                        context,
                      ).textTheme.labelSmall?.copyWith(color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            right: 8,
            top: 8,
            child: IconButton.filledTonal(
              onPressed: onClearImage,
              icon: const Icon(Icons.close_rounded),
              tooltip: t('analyzeRemoveImage'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConsentCard extends StatelessWidget {
  const _ConsentCard({
    required this.value,
    required this.isBusy,
    required this.onChanged,
  });

  final bool value;
  final bool isBusy;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: EdgeInsets.zero,
      borderColor: value
          ? AppColors.success.withValues(alpha: 0.45)
          : AppColors.warning.withValues(alpha: 0.45),
      child: CheckboxListTile(
        value: value,
        onChanged: isBusy ? null : (next) => onChanged(next ?? false),
        controlAffinity: ListTileControlAffinity.leading,
        title: Text(t('analyzeConsentTitle')),
        subtitle: Text(t('analyzeConsentBody')),
      ),
    );
  }
}

class _ReadinessChecklist extends StatelessWidget {
  const _ReadinessChecklist({required this.items});

  final List<_ReadinessItem> items;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('analyzeChecklistTitle'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          for (final item in items) ...[
            _ReadinessRow(item: item),
            if (item != items.last) const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _ReadinessRow extends StatelessWidget {
  const _ReadinessRow({required this.item});

  final _ReadinessItem item;

  @override
  Widget build(BuildContext context) {
    final color = item.done ? AppColors.success : AppColors.warning;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: 0.16),
            border: Border.all(color: color.withValues(alpha: 0.55)),
          ),
          child: Icon(
            item.done ? Icons.check_rounded : item.icon,
            color: color,
            size: 17,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.label, style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 2),
              Text(
                item.hint,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({
    required this.message,
    required this.guestLocked,
    required this.onLogin,
    required this.onRegister,
  });

  final String message;
  final bool guestLocked;
  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      fillColor: AppColors.error.withValues(alpha: 0.12),
      borderColor: AppColors.error.withValues(alpha: 0.28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppColors.error),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      guestLocked
                          ? t('analyzeErrorLoginRequired')
                          : t('analyzeErrorTitle'),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (guestLocked) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: PremiumButton(
                    text: t('login'),
                    icon: Icons.login_rounded,
                    onPressed: onLogin,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: PremiumButton(
                    text: t('register'),
                    icon: Icons.person_add_alt_rounded,
                    isSecondary: true,
                    onPressed: onRegister,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _WarningBanner extends StatelessWidget {
  const _WarningBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(14),
      fillColor: AppColors.warning.withValues(alpha: 0.12),
      borderColor: AppColors.warning.withValues(alpha: 0.28),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_amber_rounded, color: AppColors.warning),
          const SizedBox(width: 10),
          Expanded(child: Text('${t('warning')}: $message')),
        ],
      ),
    );
  }
}

class _FollowUpCard extends StatelessWidget {
  const _FollowUpCard({
    required this.controller,
    required this.isBusy,
    required this.question,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool isBusy;
  final String question;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return GlassmorphismCard(
      padding: const EdgeInsets.all(16),
      borderColor: AppColors.primary.withValues(alpha: 0.32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology_alt_rounded),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  t('analyzeFollowUpTitle'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            question,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            enabled: !isBusy,
            minLines: 2,
            maxLines: 5,
            decoration: InputDecoration(hintText: t('analyzeFollowUpHint')),
          ),
          const SizedBox(height: 12),
          PremiumButton(
            text: t('analyzeFollowUpButton'),
            icon: Icons.send_rounded,
            isLoading: isBusy,
            onPressed: isBusy ? null : onSubmit,
          ),
        ],
      ),
    );
  }
}

class _StickyActionBar extends StatelessWidget {
  const _StickyActionBar({
    required this.canSubmit,
    required this.isBusy,
    required this.guestLocked,
    required this.readinessMessage,
    required this.onAnalyze,
    required this.onLogin,
  });

  final bool canSubmit;
  final bool isBusy;
  final bool guestLocked;
  final String readinessMessage;
  final VoidCallback onAnalyze;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    final title = guestLocked
        ? t('analyzeActionLoginRequired')
        : canSubmit
        ? t('analyzeActionReady')
        : t('analyzeActionFinalChecks');

    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(
          context,
        ).scaffoldBackgroundColor.withValues(alpha: 0.94),
        border: Border(
          top: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      readinessMessage,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 126, maxWidth: 168),
                child: PremiumButton(
                  text: isBusy
                      ? t('analyzing')
                      : guestLocked
                      ? t('login')
                      : t('analyzeButton'),
                  icon: guestLocked
                      ? Icons.login_rounded
                      : Icons.auto_awesome_rounded,
                  isLoading: isBusy,
                  onPressed: guestLocked
                      ? onLogin
                      : canSubmit
                      ? onAnalyze
                      : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingOverlay extends StatelessWidget {
  const _LoadingOverlay({required this.modeMeta});

  final _ModeMeta modeMeta;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: AppColors.scrim,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: GlassmorphismCard(
              padding: const EdgeInsets.all(22),
              borderRadius: 24,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedLoading(message: t('analyzeLoadingTitle')),
                  const SizedBox(height: 14),
                  Text(
                    t('analyzeLoadingDescription'),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 18),
                  for (final step in modeMeta.steps) ...[
                    _LoadingStep(text: step),
                    if (step != modeMeta.steps.last) const SizedBox(height: 10),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LoadingStep extends StatelessWidget {
  const _LoadingStep({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
          padding: const EdgeInsets.all(12),
          decoration: _panelDecoration(AppColors.card.withValues(alpha: 0.3)),
          child: Row(
            children: [
              const Icon(Icons.blur_on_rounded, size: 17),
              const SizedBox(width: 9),
              Expanded(child: Text(text)),
            ],
          ),
        )
        .animate(onPlay: (controller) => controller.repeat())
        .shimmer(
          duration: 1800.ms,
          color: AppColors.primaryLight.withValues(alpha: 0.25),
        );
  }
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: AppColors.primaryLight,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _SignalChip extends StatelessWidget {
  const _SignalChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.32),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelSmall),
    );
  }
}

class _StrengthBadge extends StatelessWidget {
  const _StrengthBadge({required this.strength});

  final _ContextStrength strength;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: strength.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: strength.color.withValues(alpha: 0.45)),
      ),
      child: Text(
        strength.label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: strength.color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _ModeStatePill extends StatelessWidget {
  const _ModeStatePill({required this.isLive});

  final bool isLive;

  @override
  Widget build(BuildContext context) {
    return _SignalChip(
      label: isLive ? t('analyzeModeLive') : t('analyzeModeWaiting'),
    );
  }
}

class _PulseOrb extends StatelessWidget {
  const _PulseOrb({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.25),
                blurRadius: 18,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white),
        )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .scale(
          duration: 1400.ms,
          begin: const Offset(0.96, 0.96),
          end: const Offset(1.04, 1.04),
        );
  }
}

class _CornerFrame extends StatelessWidget {
  const _CornerFrame();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _CornerFramePainter());
  }
}

class _ScanLine extends StatelessWidget {
  const _ScanLine({this.subtle = false});

  final bool subtle;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Align(
          alignment: Alignment.topCenter,
          child:
              Container(
                    height: 2,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withValues(
                        alpha: subtle ? 0.35 : 0.75,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryLight.withValues(alpha: 0.45),
                          blurRadius: 18,
                        ),
                      ],
                    ),
                  )
                  .animate(onPlay: (controller) => controller.repeat())
                  .moveY(
                    begin: 0,
                    end: constraints.maxHeight,
                    duration: 2600.ms,
                    curve: Curves.easeInOut,
                  )
                  .then()
                  .moveY(
                    begin: constraints.maxHeight,
                    end: 0,
                    duration: 2600.ms,
                    curve: Curves.easeInOut,
                  ),
        );
      },
    );
  }
}

class _CornerFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primaryLight.withValues(alpha: 0.82)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    const inset = 12.0;
    const length = 28.0;

    void corner(Offset start, Offset horizontal, Offset vertical) {
      canvas
        ..drawLine(start, start + horizontal, paint)
        ..drawLine(start, start + vertical, paint);
    }

    corner(
      const Offset(inset, inset),
      const Offset(length, 0),
      const Offset(0, length),
    );
    corner(
      Offset(size.width - inset, inset),
      const Offset(-length, 0),
      const Offset(0, length),
    );
    corner(
      Offset(inset, size.height - inset),
      const Offset(length, 0),
      const Offset(0, -length),
    );
    corner(
      Offset(size.width - inset, size.height - inset),
      const Offset(-length, 0),
      const Offset(0, -length),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ModeMeta {
  const _ModeMeta({
    required this.mode,
    required this.marker,
    required this.label,
    required this.description,
    required this.summary,
    required this.steps,
    required this.icon,
  });

  final _AnalysisMode mode;
  final String marker;
  final String label;
  final String description;
  final String summary;
  final List<String> steps;
  final IconData icon;
}

class _ReadinessItem {
  const _ReadinessItem({
    required this.icon,
    required this.label,
    required this.done,
    required this.hint,
  });

  final IconData icon;
  final String label;
  final bool done;
  final String hint;
}

class _ContextStrength {
  const _ContextStrength({required this.label, required this.color});

  final String label;
  final Color color;
}

_AnalysisMode _analysisMode({required bool hasText, required bool hasImage}) {
  if (hasText && hasImage) return _AnalysisMode.multimodal;
  if (hasImage) return _AnalysisMode.image;
  if (hasText) return _AnalysisMode.text;
  return _AnalysisMode.empty;
}

_ModeMeta _modeMeta(_AnalysisMode mode) {
  return switch (mode) {
    _AnalysisMode.text => _ModeMeta(
      mode: mode,
      marker: 'TXT',
      label: t('analyzeModeTextLabel'),
      description: t('analyzeModeTextDescription'),
      summary: t('analyzeHeroModeText'),
      icon: Icons.notes_rounded,
      steps: [
        t('analyzeLoadingTextStep1'),
        t('analyzeLoadingTextStep2'),
        t('analyzeLoadingTextStep3'),
      ],
    ),
    _AnalysisMode.image => _ModeMeta(
      mode: mode,
      marker: 'IMG',
      label: t('analyzeModeImageLabel'),
      description: t('analyzeModeImageDescription'),
      summary: t('analyzeHeroModeImage'),
      icon: Icons.face_retouching_natural_rounded,
      steps: [
        t('analyzeLoadingImageStep1'),
        t('analyzeLoadingImageStep2'),
        t('analyzeLoadingImageStep3'),
      ],
    ),
    _AnalysisMode.multimodal => _ModeMeta(
      mode: mode,
      marker: 'MIX',
      label: t('analyzeModeMultimodalLabel'),
      description: t('analyzeModeMultimodalDescription'),
      summary: t('analyzeHeroModeMultimodal'),
      icon: Icons.hub_rounded,
      steps: [
        t('analyzeLoadingMultimodalStep1'),
        t('analyzeLoadingMultimodalStep2'),
        t('analyzeLoadingMultimodalStep3'),
      ],
    ),
    _AnalysisMode.empty => _ModeMeta(
      mode: mode,
      marker: '...',
      label: t('analyzeModeEmptyLabel'),
      description: t('analyzeModeEmptyDescription'),
      summary: t('analyzeHeroModeEmpty'),
      icon: Icons.auto_awesome_rounded,
      steps: [
        t('analyzeLoadingDefaultStep1'),
        t('analyzeLoadingDefaultStep2'),
        t('analyzeLoadingDefaultStep3'),
      ],
    ),
  };
}

_ContextStrength _contextStrength(int length) {
  if (length >= 220) {
    return _ContextStrength(
      label: t('analyzeContextStrong'),
      color: AppColors.success,
    );
  }
  if (length >= 80) {
    return _ContextStrength(
      label: t('analyzeContextMedium'),
      color: AppColors.primaryLight,
    );
  }
  if (length > 0) {
    return _ContextStrength(
      label: t('analyzeContextShort'),
      color: AppColors.warning,
    );
  }
  return _ContextStrength(
    label: t('analyzeContextEmpty'),
    color: AppColors.textTertiary,
  );
}

String _readinessMessage({
  required bool hasText,
  required bool hasImage,
  required bool visualConsent,
  required bool guestLocked,
  required _AnalysisMode mode,
}) {
  if (guestLocked) return t('analyzeReadinessLocked');
  if (!hasText && !hasImage) return t('analyzeReadinessMissingInput');
  if (hasImage && !visualConsent) return t('analyzeReadinessMissingConsent');
  return switch (mode) {
    _AnalysisMode.multimodal => t('analyzeReadinessReadyMultimodal'),
    _AnalysisMode.image => t('analyzeReadinessReadyImage'),
    _AnalysisMode.text => t('analyzeReadinessReadyText'),
    _AnalysisMode.empty => t('analyzeReadinessMissingInput'),
  };
}

BoxDecoration _panelDecoration(Color color) {
  return BoxDecoration(
    color: color,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: AppColors.border.withValues(alpha: 0.45)),
  );
}

BoxDecoration _scannerDecoration() {
  return BoxDecoration(
    color: AppColors.card.withValues(alpha: 0.28),
    borderRadius: BorderRadius.circular(18),
    border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.26)),
  );
}

String _format(String key, Map<String, Object> values) {
  var text = t(key);
  for (final entry in values.entries) {
    text = text.replaceAll('{${entry.key}}', entry.value.toString());
  }
  return text;
}
