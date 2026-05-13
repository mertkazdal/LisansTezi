/// Reusable surface, glass, shadow, and glow decorations.
library;

import 'dart:ui';

import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppDecorations {
  AppDecorations._();

  static BoxDecoration glassmorphism({
    double borderRadius = 20,
    Color? fillColor,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: fillColor ?? AppColors.glassFill,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(color: borderColor ?? AppColors.glassBorder, width: 1),
    );
  }

  static const double glassBlurSigma = 16;

  static ImageFilter get glassBlurFilter =>
      ImageFilter.blur(sigmaX: glassBlurSigma, sigmaY: glassBlurSigma);

  static List<BoxShadow> get premiumShadow => [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.08),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
    BoxShadow(
      color: AppColors.secondary.withValues(alpha: 0.05),
      blurRadius: 48,
      offset: const Offset(0, 16),
    ),
  ];

  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.2),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static BoxDecoration gradientBorder({
    double borderRadius = 20,
    Gradient? gradient,
  }) {
    return BoxDecoration(
      borderRadius: BorderRadius.circular(borderRadius),
      gradient: gradient ?? AppColors.primaryGradient,
    );
  }

  static List<BoxShadow> neonGlow(Color color, {double intensity = 0.4}) => [
    BoxShadow(
      color: color.withValues(alpha: intensity),
      blurRadius: 16,
      spreadRadius: 2,
    ),
    BoxShadow(
      color: color.withValues(alpha: intensity * 0.5),
      blurRadius: 32,
      spreadRadius: 4,
    ),
  ];

  static BoxDecoration get premiumCard => BoxDecoration(
    color: AppColors.card,
    borderRadius: BorderRadius.circular(20),
    border: Border.all(color: AppColors.border),
    boxShadow: cardShadow,
  );

  static BoxDecoration get surfaceCard => BoxDecoration(
    color: AppColors.surface,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: AppColors.border, width: 0.5),
  );
}
