/// Animated full-screen gradient background used by premium-feeling screens.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import 'particle_background.dart';

class AnimatedGradientBackground extends StatelessWidget {
  const AnimatedGradientBackground({
    super.key,
    required this.child,
    this.includeParticles = true,
  });

  final Widget child;
  final bool includeParticles;

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final startColor = isLight
        ? AppColors.lightBackground
        : AppColors.background;
    final middleColor = isLight ? AppColors.lightSurface : AppColors.surface;
    final endColor = isLight ? AppColors.lightCard : AppColors.card;

    return Stack(
      fit: StackFit.expand,
      children: [
        Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [startColor, middleColor],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            )
            .animate(onPlay: (controller) => controller.repeat(reverse: true))
            .custom(
              duration: 6.seconds,
              builder: (context, value, child) {
                return DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Color.lerp(startColor, middleColor, value)!,
                        Color.lerp(middleColor, endColor, value)!,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                );
              },
            ),
        if (includeParticles) const ParticleBackground(),
        child,
      ],
    );
  }
}
