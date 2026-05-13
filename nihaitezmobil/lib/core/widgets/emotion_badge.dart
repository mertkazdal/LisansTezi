/// Compact emotion badge with localized label and emoji.
library;

import 'package:flutter/material.dart';

import '../constants/emotion_constants.dart';
import '../i18n/app_localizations.dart';

class EmotionBadge extends StatelessWidget {
  const EmotionBadge({
    super.key,
    required this.emotionKey,
    this.showIcon = true,
  });

  final String emotionKey;
  final bool showIcon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final emotion = Emotion.fromKey(emotionKey);
    final color = emotion.color;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        border: Border.all(color: color.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Text(emotion.emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
          ],
          Text(
            emotion.label(AppLocalizations.currentLocale),
            style: theme.textTheme.labelMedium?.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}
