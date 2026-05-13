/// Lightweight staggered entrance wrapper for premium mobile sections.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AnimatedSection extends StatelessWidget {
  const AnimatedSection({
    super.key,
    required this.child,
    this.delay = Duration.zero,
  });

  final Widget child;
  final Duration delay;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: delay)
        .fadeIn(duration: 420.ms, curve: Curves.easeOut)
        .slideY(begin: 0.08, end: 0, duration: 420.ms, curve: Curves.easeOut);
  }
}
