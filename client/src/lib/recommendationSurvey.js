export const RECOMMENDATION_GOAL_OPTIONS = [
  { key: "comfort", tr: "Rahatlama", en: "Comfort", trDescription: "Daha sakin, güvenli ve yumuşak öneriler.", enDescription: "Softer, safer, more calming picks." },
  { key: "focus", tr: "Odak", en: "Focus", trDescription: "Zihni toparlayan, sade ve dikkat açan içerikler.", enDescription: "Cleaner picks that support clarity and attention." },
  { key: "energy", tr: "Enerji", en: "Energy", trDescription: "Motivasyon ve hareket hissi veren seçimler.", enDescription: "More motivating picks with momentum." },
  { key: "discovery", tr: "Keşif", en: "Discovery", trDescription: "Yeni tatlar, farklı türler ve sürpriz öneriler.", enDescription: "Fresh genres, new moods, and surprising picks." },
];

export const ENERGY_PREFERENCE_OPTIONS = [
  { key: "soft", tr: "Yumuşak", en: "Soft", trDescription: "Yavaş tempo, düşük yoğunluk, rahat akış.", enDescription: "Slow pace, low intensity, gentle flow." },
  { key: "balanced", tr: "Dengeli", en: "Balanced", trDescription: "Ne çok sakin ne çok sert; orta ritim.", enDescription: "Neither too calm nor too intense." },
  { key: "high", tr: "Yüksek enerji", en: "High energy", trDescription: "Canlı, dinamik ve yükselten öneriler.", enDescription: "Livelier picks that lift the pace." },
];

export const MUSIC_GENRE_OPTIONS = [
  { key: "acoustic", tr: "Akustik", en: "Acoustic" },
  { key: "pop", tr: "Pop", en: "Pop" },
  { key: "indie", tr: "Indie", en: "Indie" },
  { key: "electronic", tr: "Elektronik", en: "Electronic" },
  { key: "rap", tr: "Rap", en: "Rap" },
  { key: "classical", tr: "Klasik", en: "Classical" },
];

export const MOVIE_GENRE_OPTIONS = [
  { key: "comedy", tr: "Komedi", en: "Comedy" },
  { key: "drama", tr: "Dram", en: "Drama" },
  { key: "adventure", tr: "Macera", en: "Adventure" },
  { key: "science_fiction", tr: "Bilim kurgu", en: "Science fiction" },
  { key: "documentary", tr: "Belgesel", en: "Documentary" },
  { key: "romance", tr: "Romantik", en: "Romance" },
];

export const BOOK_GENRE_OPTIONS = [
  { key: "self_growth", tr: "Kişisel gelişim", en: "Self growth" },
  { key: "fiction", tr: "Kurgu", en: "Fiction" },
  { key: "psychology", tr: "Psikoloji", en: "Psychology" },
  { key: "memoir", tr: "Anı", en: "Memoir" },
  { key: "poetry", tr: "Şiir", en: "Poetry" },
  { key: "philosophy", tr: "Felsefe", en: "Philosophy" },
];

function pickLabel(option, language) {
  return String(language || "tr").startsWith("en") ? option.en : option.tr;
}

function pickDescription(option, language) {
  return String(language || "tr").startsWith("en") ? option.enDescription : option.trDescription;
}

export function getSurveyChoiceLabel(options, key, language) {
  const matched = options.find((option) => option.key === key);
  return matched ? pickLabel(matched, language) : key;
}

export function mapSurveyChoices(options, language) {
  return options.map((option) => ({
    key: option.key,
    label: pickLabel(option, language),
    description: pickDescription(option, language),
  }));
}
