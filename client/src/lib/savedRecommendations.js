const STORAGE_KEY = "yasam_kocu_saved_recommendations";

export const SAVED_RECOMMENDATIONS_EVENT = "yasam-kocu-saved-recommendations-change";

export function getSavedRecommendations() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeSavedRecommendation)
      .filter(Boolean)
      .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());
  } catch {
    return [];
  }
}

export function saveRecommendation(item) {
  const normalized = normalizeSavedRecommendation(item);
  if (!normalized || !canUseStorage()) {
    return getSavedRecommendations();
  }

  const current = getSavedRecommendations();
  const withoutDuplicate = current.filter((savedItem) => savedItem.id !== normalized.id);
  const nextItems = [{ ...normalized, savedAt: normalized.savedAt || new Date().toISOString() }, ...withoutDuplicate].slice(0, 80);
  writeSavedRecommendations(nextItems);
  return nextItems;
}

export function removeSavedRecommendation(id) {
  if (!id || !canUseStorage()) {
    return getSavedRecommendations();
  }

  const nextItems = getSavedRecommendations().filter((item) => item.id !== id);
  writeSavedRecommendations(nextItems);
  return nextItems;
}

export function isRecommendationSaved(id) {
  if (!id) {
    return false;
  }

  return getSavedRecommendations().some((item) => item.id === id);
}

export function toggleSavedRecommendation(item) {
  const normalized = normalizeSavedRecommendation(item);
  if (!normalized) {
    return { saved: false, items: getSavedRecommendations(), item: null };
  }

  if (isRecommendationSaved(normalized.id)) {
    const items = removeSavedRecommendation(normalized.id);
    return { saved: false, items, item: normalized };
  }

  const items = saveRecommendation(normalized);
  return { saved: true, items, item: normalized };
}

export function clearSavedRecommendations() {
  writeSavedRecommendations([]);
  return [];
}

export function createSavedRecommendationId({ type, title, subtitle, sourceHistoryId }) {
  return [type || "recommendation", sourceHistoryId || "local", slugify(title), slugify(subtitle)].filter(Boolean).join(":");
}

function writeSavedRecommendations(items) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(SAVED_RECOMMENDATIONS_EVENT, { detail: { items } }));
}

function normalizeSavedRecommendation(item) {
  if (!item || !item.title) {
    return null;
  }

  const type = item.type || "advice";
  const normalized = {
    id: item.id || createSavedRecommendationId(item),
    type,
    title: String(item.title || "").trim(),
    subtitle: String(item.subtitle || "").trim(),
    reason: String(item.reason || "").trim(),
    imageUrl: item.imageUrl || null,
    externalUrl: item.externalUrl || null,
    emotion: item.emotion || null,
    savedAt: item.savedAt || new Date().toISOString(),
    sourceHistoryId: item.sourceHistoryId || null,
  };

  return normalized.title ? normalized : null;
}

function slugify(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
