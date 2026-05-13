/// Local saved recommendations provider mirroring the web profile list.
library;

import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../shared/providers/storage_provider.dart';
import '../../domain/saved_recommendation.dart';

const _savedRecommendationsKey = 'yasam_kocu_saved_recommendations';

final savedRecommendationsProvider =
    StateNotifierProvider<
      SavedRecommendationsNotifier,
      List<SavedRecommendation>
    >((ref) {
      return SavedRecommendationsNotifier(ref.watch(sharedPreferencesProvider));
    });

class SavedRecommendationsNotifier
    extends StateNotifier<List<SavedRecommendation>> {
  SavedRecommendationsNotifier(this._prefs) : super(const []) {
    state = _read();
  }

  final SharedPreferences _prefs;

  bool isSaved(String id) {
    return state.any((item) => item.id == id);
  }

  Future<bool> toggle(SavedRecommendation item) async {
    final isAlreadySaved = isSaved(item.id);
    state = isAlreadySaved
        ? state.where((saved) => saved.id != item.id).toList()
        : [
            item,
            ...state.where((saved) => saved.id != item.id),
          ].take(80).toList();
    await _write();
    return !isAlreadySaved;
  }

  Future<void> remove(String id) async {
    state = state.where((item) => item.id != id).toList();
    await _write();
  }

  Future<void> clearAll() async {
    state = const [];
    await _write();
  }

  List<SavedRecommendation> _read() {
    final raw = _prefs.getString(_savedRecommendationsKey);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return decoded
          .whereType<Map>()
          .map((item) => SavedRecommendation.fromJson(Map.from(item)))
          .where((item) => item.id.isNotEmpty && item.title.isNotEmpty)
          .toList()
        ..sort((left, right) => right.createdAt.compareTo(left.createdAt));
    } on FormatException {
      return const [];
    }
  }

  Future<void> _write() async {
    final encoded = jsonEncode(state.map((item) => item.toJson()).toList());
    await _prefs.setString(_savedRecommendationsKey, encoded);
  }
}
