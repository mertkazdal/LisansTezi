/// Glassmorphism card surface used by premium mobile panels.
library;

import 'package:flutter/material.dart';

import '../theme/app_decorations.dart';

class GlassmorphismCard extends StatelessWidget {
  const GlassmorphismCard({
    super.key,
    required this.child,
    this.borderRadius = 20,
    this.fillColor,
    this.borderColor,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
  });

  final Widget child;
  final double borderRadius;
  final Color? fillColor;
  final Color? borderColor;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: AppDecorations.glassBlurFilter,
          child: Container(
            padding: padding,
            decoration: AppDecorations.glassmorphism(
              borderRadius: borderRadius,
              fillColor: fillColor,
              borderColor: borderColor,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
