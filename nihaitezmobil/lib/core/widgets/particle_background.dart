/// Subtle animated particles for non-blocking motion in background surfaces.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class ParticleBackground extends StatefulWidget {
  const ParticleBackground({super.key, this.particleCount = 24});

  final int particleCount;

  @override
  State<ParticleBackground> createState() => _ParticleBackgroundState();
}

class _ParticleBackgroundState extends State<ParticleBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<_Particle> _particles;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();

    final random = math.Random(42);
    _particles = List.generate(
      widget.particleCount,
      (_) => _Particle(
        x: random.nextDouble(),
        y: random.nextDouble(),
        radius: 1.5 + random.nextDouble() * 3.5,
        speed: 0.12 + random.nextDouble() * 0.24,
        opacity: 0.08 + random.nextDouble() * 0.16,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: _ParticlePainter(_particles, _controller.value),
            size: Size.infinite,
          );
        },
      ),
    );
  }
}

class _Particle {
  const _Particle({
    required this.x,
    required this.y,
    required this.radius,
    required this.speed,
    required this.opacity,
  });

  final double x;
  final double y;
  final double radius;
  final double speed;
  final double opacity;
}

class _ParticlePainter extends CustomPainter {
  const _ParticlePainter(this.particles, this.progress);

  final List<_Particle> particles;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.primary;
    for (final particle in particles) {
      final y = (particle.y + progress * particle.speed) % 1;
      paint.color = AppColors.primary.withValues(alpha: particle.opacity);
      canvas.drawCircle(
        Offset(particle.x * size.width, y * size.height),
        particle.radius,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
