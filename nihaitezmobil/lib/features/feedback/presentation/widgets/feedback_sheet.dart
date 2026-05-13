/// Bottom sheet form for submitting analysis feedback.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../domain/feedback_models.dart';
import '../providers/feedback_provider.dart';

class FeedbackSheet extends ConsumerStatefulWidget {
  const FeedbackSheet({super.key, required this.historyId});

  final String historyId;

  @override
  ConsumerState<FeedbackSheet> createState() => _FeedbackSheetState();
}

class _FeedbackSheetState extends ConsumerState<FeedbackSheet> {
  final _commentController = TextEditingController();
  int _overallRating = 5;
  int _accuracyRating = 5;
  int _recommendationRating = 5;
  bool _helpful = true;
  bool _wouldReuse = true;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    await ref
        .read(feedbackProvider(widget.historyId).notifier)
        .submit(
          FeedbackRequest(
            overallRating: _overallRating,
            analysisAccuracyRating: _accuracyRating,
            recommendationQualityRating: _recommendationRating,
            helpful: _helpful,
            wouldReuse: _wouldReuse,
            comment: _commentController.text,
          ),
        );

    if (!mounted) return;
    final state = ref.read(feedbackProvider(widget.historyId));
    if (state.hasFeedback) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedbackProvider(widget.historyId));
    final isSubmitting = state.isSubmitting;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                t('feedbackTitle'),
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 6),
              Text(
                t('feedbackSubtitle'),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 18),
              _RatingPicker(
                label: t('overallRating'),
                value: _overallRating,
                onChanged: isSubmitting
                    ? null
                    : (value) => setState(() => _overallRating = value),
              ),
              _RatingPicker(
                label: t('analysisAccuracyRating'),
                value: _accuracyRating,
                onChanged: isSubmitting
                    ? null
                    : (value) => setState(() => _accuracyRating = value),
              ),
              _RatingPicker(
                label: t('recommendationQualityRating'),
                value: _recommendationRating,
                onChanged: isSubmitting
                    ? null
                    : (value) => setState(() => _recommendationRating = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(t('feedbackHelpful')),
                value: _helpful,
                onChanged: isSubmitting
                    ? null
                    : (value) => setState(() => _helpful = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(t('feedbackWouldReuse')),
                value: _wouldReuse,
                onChanged: isSubmitting
                    ? null
                    : (value) => setState(() => _wouldReuse = value),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _commentController,
                enabled: !isSubmitting,
                minLines: 3,
                maxLines: 5,
                decoration: InputDecoration(
                  labelText: t('feedbackComment'),
                  hintText: t('feedbackCommentHint'),
                ),
              ),
              if (state.errorMessage != null) ...[
                const SizedBox(height: 12),
                Text(
                  state.errorMessage!,
                  style: const TextStyle(color: AppColors.error),
                ),
              ],
              const SizedBox(height: 18),
              PremiumButton(
                text: t('submitFeedback'),
                icon: Icons.rate_review,
                isLoading: isSubmitting,
                onPressed: isSubmitting ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RatingPicker extends StatelessWidget {
  const _RatingPicker({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final int value;
  final ValueChanged<int>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: List.generate(5, (index) {
              final rating = index + 1;
              return ChoiceChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star, size: 16),
                    const SizedBox(width: 4),
                    Text('$rating'),
                  ],
                ),
                selected: value == rating,
                onSelected: onChanged == null
                    ? null
                    : (_) {
                        onChanged!(rating);
                      },
              );
            }),
          ),
        ],
      ),
    );
  }
}
