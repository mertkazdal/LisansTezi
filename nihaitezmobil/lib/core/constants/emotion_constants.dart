/// Twelve-emotion contract mirrored from the web project's shared contract.
library;

import 'package:flutter/material.dart';

enum EmotionGroup { positive, negative, neutral }

enum Emotion {
  happy(
    key: 'happy',
    group: EmotionGroup.positive,
    labelTr: 'Mutlu',
    labelEn: 'Happy',
    emoji: '\u{1F60A}',
    color: Color(0xFFFFD700),
    icon: Icons.sentiment_very_satisfied,
  ),
  sad(
    key: 'sad',
    group: EmotionGroup.negative,
    labelTr: '\u00dczg\u00fcn',
    labelEn: 'Sad',
    emoji: '\u{1F622}',
    color: Color(0xFF6366F1),
    icon: Icons.sentiment_dissatisfied,
  ),
  angry(
    key: 'angry',
    group: EmotionGroup.negative,
    labelTr: '\u00d6fkeli',
    labelEn: 'Angry',
    emoji: '\u{1F620}',
    color: Color(0xFFEF4444),
    icon: Icons.sentiment_very_dissatisfied,
  ),
  anxious(
    key: 'anxious',
    group: EmotionGroup.negative,
    labelTr: 'Endi\u015feli',
    labelEn: 'Anxious',
    emoji: '\u{1F630}',
    color: Color(0xFFF59E0B),
    icon: Icons.psychology_alt,
  ),
  excited(
    key: 'excited',
    group: EmotionGroup.positive,
    labelTr: 'Heyecanl\u0131',
    labelEn: 'Excited',
    emoji: '\u{1F929}',
    color: Color(0xFFEC4899),
    icon: Icons.celebration,
  ),
  calm(
    key: 'calm',
    group: EmotionGroup.neutral,
    labelTr: 'Sakin',
    labelEn: 'Calm',
    emoji: '\u{1F60C}',
    color: Color(0xFF06B6D4),
    icon: Icons.spa,
  ),
  tired(
    key: 'tired',
    group: EmotionGroup.negative,
    labelTr: 'Yorgun',
    labelEn: 'Tired',
    emoji: '\u{1F634}',
    color: Color(0xFF8B5CF6),
    icon: Icons.bedtime,
  ),
  stressed(
    key: 'stressed',
    group: EmotionGroup.negative,
    labelTr: 'Stresli',
    labelEn: 'Stressed',
    emoji: '\u{1F624}',
    color: Color(0xFFF97316),
    icon: Icons.flash_on,
  ),
  nostalgic(
    key: 'nostalgic',
    group: EmotionGroup.neutral,
    labelTr: 'Nostaljik',
    labelEn: 'Nostalgic',
    emoji: '\u{1F979}',
    color: Color(0xFFA78BFA),
    icon: Icons.auto_awesome,
  ),
  motivated(
    key: 'motivated',
    group: EmotionGroup.positive,
    labelTr: 'Motive',
    labelEn: 'Motivated',
    emoji: '\u{1F4AA}',
    color: Color(0xFF10B981),
    icon: Icons.rocket_launch,
  ),
  hopeful(
    key: 'hopeful',
    group: EmotionGroup.positive,
    labelTr: 'Umutlu',
    labelEn: 'Hopeful',
    emoji: '\u{1F31F}',
    color: Color(0xFF34D399),
    icon: Icons.wb_sunny,
  ),
  overwhelmed(
    key: 'overwhelmed',
    group: EmotionGroup.negative,
    labelTr: 'Bunalm\u0131\u015f',
    labelEn: 'Overwhelmed',
    emoji: '\u{1F635}',
    color: Color(0xFFF43F5E),
    icon: Icons.waves,
  );

  const Emotion({
    required this.key,
    required this.group,
    required this.labelTr,
    required this.labelEn,
    required this.emoji,
    required this.color,
    required this.icon,
  });

  final String key;
  final EmotionGroup group;
  final String labelTr;
  final String labelEn;
  final String emoji;
  final Color color;
  final IconData icon;

  String label(String locale) => locale == 'tr' ? labelTr : labelEn;

  static Emotion fromKey(String key) {
    return Emotion.values.firstWhere(
      (emotion) => emotion.key == key.toLowerCase().trim(),
      orElse: () => Emotion.calm,
    );
  }

  static Color colorFromKey(String key) => fromKey(key).color;
}
