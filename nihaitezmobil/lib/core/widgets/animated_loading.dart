/// Reusable animated loading indicator.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';

class AnimatedLoading extends StatelessWidget {
  const AnimatedLoading({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: 0.2),
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
                child: const Icon(
                  Icons.psychology,
                  color: AppColors.primary,
                  size: 30,
                ),
              )
              .animate(onPlay: (controller) => controller.repeat())
              .scale(
                duration: 1.seconds,
                begin: const Offset(0.9, 0.9),
                end: const Offset(1.1, 1.1),
                curve: Curves.easeInOut,
              )
              .then()
              .scale(
                duration: 1.seconds,
                begin: const Offset(1.1, 1.1),
                end: const Offset(0.9, 0.9),
                curve: Curves.easeInOut,
              ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
                  message!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                )
                .animate(onPlay: (controller) => controller.repeat())
                .fade(duration: 1.seconds, begin: 0.5, end: 1)
                .then()
                .fade(duration: 1.seconds, begin: 1, end: 0.5),
          ],
        ],
      ),
    );
  }
}
