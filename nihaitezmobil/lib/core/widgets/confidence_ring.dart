/// Animated circular confidence indicator used on result and metric surfaces.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';

class ConfidenceRing extends StatelessWidget {
  const ConfidenceRing({
    super.key,
    required this.value,
    this.size = 132,
    this.label,
    this.color = AppColors.primary,
  });

  final double value;
  final double size;
  final String? label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final normalized = value.clamp(0, 1).toDouble();
    final percent = (normalized * 100).round();

    return SizedBox.square(
      dimension: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: normalized),
        duration: 900.ms,
        curve: Curves.easeOutCubic,
        builder: (context, animatedValue, _) {
          return Stack(
            alignment: Alignment.center,
            children: [
              SizedBox.square(
                dimension: size,
                child: CircularProgressIndicator(
                  value: animatedValue,
                  strokeWidth: 10,
                  strokeCap: StrokeCap.round,
                  backgroundColor: AppColors.card.withValues(alpha: 0.72),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$percent%',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (label != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      label!,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          );
        },
      ),
    ).animate().scale(
      begin: const Offset(0.96, 0.96),
      end: const Offset(1, 1),
      duration: 360.ms,
      curve: Curves.easeOut,
    );
  }
}
