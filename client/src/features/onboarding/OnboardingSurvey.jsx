import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import styles from "./OnboardingSurvey.module.css";

export const ONBOARDING_STORAGE_KEY = "life-coach-onboarding-profile";
const ONBOARDING_DRAFT_KEY = "draft";

const EMPTY_ANSWERS = {
  music: [],
  movies: [],
  books: [],
  peakTime: null,
  socialEnergy: null,
  stressCoping: [],
  philosophy: null,
};

const SCREENS = [
  { type: "welcome" },
  {
    key: "music",
    type: "multi",
    title: "Müzikte hangi dünyalara yakınsın?",
    max: 3,
    options: ["Akustik", "Pop", "Indie", "Elektronik", "Rap / Hip-hop", "Klasik / Orkestra", "Jazz / Soul", "Metal / Rock"],
  },
  {
    key: "movies",
    type: "multi",
    title: "Film veya dizi seçerken seni ne çeker?",
    max: 3,
    options: [
      "Komedi (güldürürken düşündüren)",
      "Dram (derin ve duygusal)",
      "Macera / Aksiyon",
      "Bilim kurgu / Distopya",
      "Belgesel (gerçek hikayeler)",
      "Romantik",
      "Gerilim / Gizem",
      "Animasyon / Fantezi",
    ],
  },
  {
    key: "books",
    type: "multi",
    title: "Kitaplarda hangi damarı hissediyorsun?",
    max: 3,
    options: ["Kişisel gelişim", "Kurgu / Roman", "Psikoloji", "Anı / Biyografi", "Şiir", "Felsefe", "Bilim & Teknoloji", "Tarihi kurgu"],
  },
  {
    key: "peakTime",
    type: "single",
    title: "Günün hangi dilimi sana en çok ait hissettiriyor?",
    options: [
      { value: "Sabah erken", label: "Sabah erken", detail: "sessizlik ve taze başlangıç" },
      { value: "Gün içi", label: "Gün içi", detail: "hareketli ve üretken" },
      { value: "Akşamüstü", label: "Akşamüstü", detail: "yavaşlama zamanı" },
      { value: "Gece geç", label: "Gece geç", detail: "düşünce derin, dünya sessiz" },
    ],
  },
  {
    key: "socialEnergy",
    type: "single",
    variant: "scale",
    title: "Sosyal olarak kendini nasıl tanımlarsın?",
    options: [
      { value: "Tam içedönük", label: "Tam içedönük", detail: "yalnızlık benim için şarj" },
      { value: "Biraz içedönük", label: "Biraz içedönük", detail: "küçük grupları tercih ederim" },
      { value: "Biraz dışadönük", label: "Biraz dışadönük", detail: "insanlardan enerji alırım" },
      { value: "Tam dışadönük", label: "Tam dışadönük", detail: "kalabalık beni canlandırır" },
    ],
  },
  {
    key: "stressCoping",
    type: "multi",
    title: "Zor bir gün geçirdiğinde ne yapmak istersin?",
    max: 2,
    options: [
      "Müzik dinle ya da bir şeyler izle",
      "Yürüyüş / hareket / spor",
      "Yakın biriyle konuş",
      "Yalnız kal, sessizliğe çekil",
      "Yarat - yaz, çiz, pişir",
      "Uy ya da dinlen",
      "Kitap / podcast / içerik tüket",
    ],
  },
  {
    key: "philosophy",
    type: "single",
    variant: "cards",
    title: "Hayata dair hangi söylem sana en çok dokunuyor?",
    options: [
      { value: "Anda yaşa", label: "Anda yaşa", detail: "Gelecek değil, şu an önemli" },
      { value: "Anlam ara", label: "Anlam ara", detail: "Her şeyin bir amacı olmalı" },
      { value: "Büyü, değiş", label: "Büyü, değiş", detail: "Konfor alanı dışına çık" },
      { value: "Dengede kal", label: "Dengede kal", detail: "Sürdürülebilir ve istikrarlı" },
      { value: "Bağlan", label: "Bağlan", detail: "İlişkiler ve sevgi merkezde" },
      { value: "Özgür ol", label: "Özgür ol", detail: "Kendi kurallarını kendin yaz" },
    ],
  },
  { type: "complete" },
];

export function hasStoredOnboardingProfile() {
  return Boolean(getStoredOnboardingProfile());
}

export function getStoredOnboardingProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STORAGE_KEY) || "null");
    return parsed?.userProfile?.completedAt ? parsed.userProfile : null;
  } catch {
    return null;
  }
}

export function getStoredRecommendationSurvey() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STORAGE_KEY) || "null");
    if (parsed?.recommendationSurvey) {
      return parsed.recommendationSurvey;
    }

    return parsed?.userProfile?.completedAt
      ? mapOnboardingProfileToRecommendationSurvey(parsed.userProfile)
      : null;
  } catch {
    return null;
  }
}

export function getStoredOnboardingDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STORAGE_KEY) || "null");
    if (parsed?.userProfile?.completedAt || parsed?.recommendationSurvey || !parsed?.[ONBOARDING_DRAFT_KEY]) {
      return null;
    }

    return normalizeDraft(parsed[ONBOARDING_DRAFT_KEY]);
  } catch {
    return null;
  }
}

export function hasStoredOnboardingDraft() {
  return Boolean(getStoredOnboardingDraft());
}

export function mapOnboardingProfileToRecommendationSurvey(userProfile) {
  const musicGenres = mapSelectedOptions(userProfile?.music, [
    ["acoustic", ["akustik", "acoustic"]],
    ["pop", ["pop"]],
    ["indie", ["indie"]],
    ["electronic", ["elektronik", "electronic"]],
    ["rap", ["rap", "hip-hop", "hiphop"]],
    ["classical", ["klasik", "orkestra", "classical"]],
  ]);
  const movieGenres = mapSelectedOptions(userProfile?.movies, [
    ["comedy", ["komedi", "comedy"]],
    ["drama", ["dram", "drama"]],
    ["adventure", ["macera", "aksiyon", "adventure", "action"]],
    ["science_fiction", ["bilim", "distopya", "science", "fiction", "sci-fi"]],
    ["documentary", ["belgesel", "documentary"]],
    ["romance", ["romantik", "romance"]],
  ]);
  const bookGenres = mapSelectedOptions(userProfile?.books, [
    ["self_growth", ["kisisel", "gelisim", "self"]],
    ["fiction", ["kurgu", "roman", "fiction"]],
    ["psychology", ["psikoloji", "psychology"]],
    ["memoir", ["ani", "biyografi", "memoir", "biography"]],
    ["poetry", ["siir", "poetry"]],
    ["philosophy", ["felsefe", "philosophy"]],
  ]);

  return {
    recommendationGoal: resolveRecommendationGoal(userProfile),
    energyPreference: resolveEnergyPreference(userProfile),
    musicGenres: withFallback(musicGenres, ["acoustic"]),
    movieGenres: withFallback(movieGenres, ["drama"]),
    bookGenres: withFallback(bookGenres, ["self_growth"]),
  };
}

export default function OnboardingSurvey({ onSurveyComplete, onClose, initialProfile = null, restartFromProfile = false }) {
  const storedDraft = useMemo(() => getStoredOnboardingDraft(), []);
  const hydratedProfileAnswers = useMemo(
    () => (initialProfile ? normalizeDraftAnswers(initialProfile) : null),
    [initialProfile],
  );
  const shouldResumeDraft = Boolean(storedDraft) && !restartFromProfile;
  const shouldEditStoredProfile = restartFromProfile && hydratedProfileAnswers && hasDraftProgress(1, hydratedProfileAnswers);
  const [screen, setScreen] = useState(shouldResumeDraft ? storedDraft?.screen || 0 : shouldEditStoredProfile ? 1 : 0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState(() =>
    shouldResumeDraft
      ? storedDraft?.answers || cloneEmptyAnswers()
      : shouldEditStoredProfile
        ? hydratedProfileAnswers
        : cloneEmptyAnswers(),
  );
  const [showResumeChoice, setShowResumeChoice] = useState(shouldResumeDraft);
  const reduceMotion = useReducedMotion();
  const current = SCREENS[screen];
  const canContinue = useMemo(() => !showResumeChoice && canGoNext(current, answers), [answers, current, showResumeChoice]);

  function goNext() {
    if (screen >= SCREENS.length - 1 || !canContinue) {
      return;
    }

    setDirection(1);
    setScreen((value) => value + 1);
  }

  function goBack() {
    if (screen <= 0) {
      return;
    }

    setDirection(-1);
    setScreen((value) => value - 1);
  }

  function toggleMulti(key, option, max) {
    setAnswers((currentAnswers) => {
      const selected = currentAnswers[key] || [];
      const exists = selected.includes(option);
      const nextValue = exists
        ? selected.filter((item) => item !== option)
        : selected.length < max
          ? [...selected, option]
          : selected;

      return { ...currentAnswers, [key]: nextValue };
    });
  }

  function selectSingle(key, option) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [key]: option }));
  }

  function continueDraft() {
    setShowResumeChoice(false);
  }

  function restartSurvey() {
    setDirection(1);
    setScreen(0);
    setAnswers(cloneEmptyAnswers());
    setShowResumeChoice(false);
    clearStoredOnboardingDraft();
  }

  function closeSurvey() {
    if (!showResumeChoice && hasCompleteSurveyAnswers(answers)) {
      persistCompletedSurvey(answers);
    } else if (!showResumeChoice && hasDraftProgress(screen, answers)) {
      saveOnboardingDraft({ screen, answers });
    }

    onClose?.();
  }

  function completeSurvey() {
    const { userProfile, recommendationSurvey } = persistCompletedSurvey(answers);
    onSurveyComplete?.(userProfile, recommendationSurvey);
  }

  const variants = {
    enter: (moveDirection) => ({
      opacity: 0,
      x: reduceMotion ? 0 : moveDirection > 0 ? 60 : -60,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (moveDirection) => ({
      opacity: 0,
      x: reduceMotion ? 0 : moveDirection > 0 ? -60 : 60,
    }),
  };

  return (
    <section className={styles.overlay} role="dialog" aria-modal="true" aria-label="Kişisel yaşam koçu onboarding anketi">
      <div className={styles.shell}>
        <div className={styles.topRow}>
          <ProgressBar current={screen} total={8} />
          <button type="button" className={styles.closeButton} onClick={closeSurvey} aria-label="Anketi kapat">
            ×
          </button>
        </div>
        <div className={styles.viewport}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={screen}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={styles.screen}
            >
              {showResumeChoice && <ScreenResumeChoice onContinue={continueDraft} onRestart={restartSurvey} />}
              {!showResumeChoice && current.type === "welcome" && <ScreenWelcome onStart={goNext} />}
              {!showResumeChoice && current.type === "multi" && (
                <ScreenMultiSelect
                  screen={current}
                  value={answers[current.key]}
                  onToggle={(option) => toggleMulti(current.key, option, current.max)}
                />
              )}
              {!showResumeChoice && current.type === "single" && (
                <ScreenSingleSelect
                  screen={current}
                  value={answers[current.key]}
                  onSelect={(option) => selectSingle(current.key, option)}
                />
              )}
              {!showResumeChoice && current.type === "complete" && <ScreenComplete onComplete={completeSurvey} />}
            </motion.div>
          </AnimatePresence>
        </div>
        {!showResumeChoice && screen > 0 && screen < 8 && (
          <NavigationButtons onBack={goBack} onNext={goNext} canContinue={canContinue} />
        )}
      </div>
    </section>
  );
}

function ProgressBar({ current, total }) {
  const normalized = Math.min(current, total);
  const percentage = (normalized / total) * 100;

  return (
    <div className={styles.progressWrap} aria-label={`İlerleme: ${normalized} / ${total}`}>
      <span>{normalized} / {total}</span>
      <div className={styles.progressTrack}>
        <motion.div className={styles.progressFill} animate={{ width: `${percentage}%` }} transition={{ duration: 0.28 }} />
      </div>
    </div>
  );
}

function ScreenWelcome({ onStart }) {
  return (
    <div className={`${styles.card} ${styles.centerCard}`}>
      <p className={styles.eyebrow}>Kişisel Yaşam Koçu</p>
      <h1>Seni biraz tanıyalım</h1>
      <p className={styles.lead}>
        Bu kısa anket, yaşam koçunun sana gerçekten uygun öneriler sunabilmesi için.
        Cevapların sadece bu oturumdaki kişiselleştirme için kullanılır.
      </p>
      <button type="button" className={styles.primaryButton} onClick={onStart}>
        Başlayalım
      </button>
    </div>
  );
}

function ScreenResumeChoice({ onContinue, onRestart }) {
  return (
    <div className={`${styles.card} ${styles.centerCard}`}>
      <p className={styles.eyebrow}>Kaydedilmiş Anket</p>
      <h1>Kaldığın yerden devam edelim mi?</h1>
      <p className={styles.lead}>
        Bu oturumda yarım bıraktığın cevapları bulduk. İstersen kaldığın yerden devam et, istersen baştan başlat.
      </p>
      <div className={styles.resumeActions}>
        <button type="button" className={styles.primaryButton} onClick={onContinue}>
          Kaldığın yerden devam et
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onRestart}>
          Baştan başlat
        </button>
      </div>
    </div>
  );
}

function ScreenMultiSelect({ screen, value, onToggle }) {
  const selectedCount = value.length;
  const maxReached = selectedCount >= screen.max;

  return (
    <div className={styles.card}>
      <ScreenHeader title={screen.title} helper={`En fazla ${screen.max} seçim`} counter={`${selectedCount}/${screen.max}`} />
      <div className={styles.chipGrid}>
        {screen.options.map((option) => {
          const selected = value.includes(option);
          const disabled = maxReached && !selected;

          return (
            <ChoiceChip
              key={option}
              label={option}
              selected={selected}
              disabled={disabled}
              onClick={() => onToggle(option)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScreenSingleSelect({ screen, value, onSelect }) {
  const isCardVariant = screen.variant === "cards";

  return (
    <div className={styles.card}>
      <ScreenHeader title={screen.title} helper="Bir seçim yap" />
      <div className={`${styles.singleGrid} ${screen.variant === "scale" ? styles.scaleGrid : ""} ${isCardVariant ? styles.cardGrid : ""}`}>
        {screen.options.map((option) => (
          <ChoiceChip
            key={option.value}
            label={option.label}
            detail={option.detail}
            selected={value === option.value}
            onClick={() => onSelect(option.value)}
            card={isCardVariant}
          />
        ))}
      </div>
    </div>
  );
}

function ScreenComplete({ onComplete }) {
  return (
    <div className={`${styles.card} ${styles.centerCard}`}>
      <motion.div
        className={styles.completeMark}
        initial={{ scale: 0.78, opacity: 0 }}
        animate={{ scale: [0.78, 1.08, 1], opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        AI
      </motion.div>
      <h1>Profilin hazırlandı</h1>
      <p className={styles.lead}>
        Artık seni daha iyi tanıyoruz. Duygu durumuna göre öneriler almaya hazırsın.
      </p>
      <button type="button" className={styles.primaryButton} onClick={onComplete}>
        Koçunla tanış
      </button>
    </div>
  );
}

function ScreenHeader({ title, helper, counter }) {
  return (
    <header className={styles.screenHeader}>
      <div>
        <p>{helper}</p>
        <h2>{title}</h2>
      </div>
      {counter && <span className={styles.counter}>{counter}</span>}
    </header>
  );
}

function ChoiceChip({ label, detail, selected, disabled = false, onClick, card = false }) {
  return (
    <motion.button
      type="button"
      className={`${styles.choice} ${selected ? styles.selected : ""} ${disabled ? styles.disabled : ""} ${card ? styles.choiceCard : ""}`}
      aria-pressed={selected}
      aria-label={detail ? `${label}: ${detail}` : label}
      disabled={disabled}
      onClick={onClick}
      animate={selected ? { scale: [1, 1.015, 1] } : { scale: 1 }}
      transition={{ duration: 0.22 }}
    >
      <span className={styles.choiceMark} aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <span className={styles.choiceContent}>
        <span>{label}</span>
        {detail && <small>{detail}</small>}
      </span>
    </motion.button>
  );
}

function NavigationButtons({ onBack, onNext, canContinue }) {
  return (
    <nav className={styles.navigation} aria-label="Anket adımları">
      <button type="button" className={styles.secondaryButton} onClick={onBack}>
        Geri
      </button>
      <button type="button" className={styles.primaryButton} onClick={onNext} disabled={!canContinue}>
        İleri
      </button>
    </nav>
  );
}

function canGoNext(screen, answers) {
  if (!screen || screen.type === "welcome" || screen.type === "complete") {
    return true;
  }

  const value = answers[screen.key];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function mapSelectedOptions(values, mappings) {
  if (!Array.isArray(values)) {
    return [];
  }

  const selected = [];
  values.forEach((value) => {
    const normalizedValue = normalizeSearchText(value);
    const matched = mappings.find(([, needles]) =>
      needles.some((needle) => normalizedValue.includes(normalizeSearchText(needle))),
    );

    if (matched && !selected.includes(matched[0])) {
      selected.push(matched[0]);
    }
  });

  return selected.slice(0, 3);
}

function resolveRecommendationGoal(userProfile) {
  const profileText = normalizeProfileText(userProfile);
  if (profileText.includes("hareket") || profileText.includes("spor") || profileText.includes("buyu")) {
    return "energy";
  }

  if (profileText.includes("yarat") || profileText.includes("ozgur") || profileText.includes("bilim")) {
    return "discovery";
  }

  if (profileText.includes("anlam") || profileText.includes("kitap") || profileText.includes("podcast")) {
    return "focus";
  }

  return "comfort";
}

function saveOnboardingDraft({ screen, answers }) {
  if (typeof window === "undefined") {
    return;
  }

  const draft = {
    screen: clampDraftScreen(screen),
    answers: normalizeDraftAnswers(answers),
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  window.sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ [ONBOARDING_DRAFT_KEY]: draft }));
}

function persistCompletedSurvey(answers) {
  const normalizedAnswers = normalizeDraftAnswers(answers);
  const userProfile = {
    music: normalizedAnswers.music,
    movies: normalizedAnswers.movies,
    books: normalizedAnswers.books,
    peakTime: normalizedAnswers.peakTime,
    socialEnergy: normalizedAnswers.socialEnergy,
    stressCoping: normalizedAnswers.stressCoping,
    philosophy: normalizedAnswers.philosophy,
    completedAt: new Date().toISOString(),
  };
  const recommendationSurvey = mapOnboardingProfileToRecommendationSurvey(userProfile);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ userProfile, recommendationSurvey }));
  }

  return { userProfile, recommendationSurvey };
}

function clearStoredOnboardingDraft() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STORAGE_KEY) || "null");
    if (parsed?.[ONBOARDING_DRAFT_KEY] && !parsed?.recommendationSurvey && !parsed?.userProfile?.completedAt) {
      window.sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  } catch {
    window.sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
}

function normalizeDraft(draft) {
  if (!draft || typeof draft !== "object") {
    return null;
  }

  return {
    screen: clampDraftScreen(draft.screen),
    answers: normalizeDraftAnswers(draft.answers),
  };
}

function normalizeDraftAnswers(answers) {
  const source = answers && typeof answers === "object" ? answers : {};

  return {
    music: Array.isArray(source.music) ? source.music : [],
    movies: Array.isArray(source.movies) ? source.movies : [],
    books: Array.isArray(source.books) ? source.books : [],
    peakTime: source.peakTime || null,
    socialEnergy: source.socialEnergy || null,
    stressCoping: Array.isArray(source.stressCoping) ? source.stressCoping : [],
    philosophy: source.philosophy || null,
  };
}

function cloneEmptyAnswers() {
  return normalizeDraftAnswers(EMPTY_ANSWERS);
}

function hasDraftProgress(screen, answers) {
  return screen > 0 || Object.values(normalizeDraftAnswers(answers)).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
}

function hasCompleteSurveyAnswers(answers) {
  return SCREENS
    .filter((screen) => screen.key)
    .every((screen) => canGoNext(screen, normalizeDraftAnswers(answers)));
}

function clampDraftScreen(screen) {
  const numericScreen = Number(screen);
  if (!Number.isFinite(numericScreen)) {
    return 0;
  }

  return Math.max(0, Math.min(SCREENS.length - 2, Math.trunc(numericScreen)));
}

function resolveEnergyPreference(userProfile) {
  const profileText = normalizeProfileText(userProfile);
  if (profileText.includes("tam disadonuk") || profileText.includes("hareket") || profileText.includes("spor")) {
    return "high";
  }

  if (profileText.includes("tam icedonuk") || profileText.includes("yalniz") || profileText.includes("uy") || profileText.includes("dinlen")) {
    return "soft";
  }

  return "balanced";
}

function normalizeProfileText(userProfile) {
  return normalizeSearchText([
    ...(Array.isArray(userProfile?.music) ? userProfile.music : []),
    ...(Array.isArray(userProfile?.movies) ? userProfile.movies : []),
    ...(Array.isArray(userProfile?.books) ? userProfile.books : []),
    userProfile?.peakTime,
    userProfile?.socialEnergy,
    ...(Array.isArray(userProfile?.stressCoping) ? userProfile.stressCoping : []),
    userProfile?.philosophy,
  ].filter(Boolean).join(" "));
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i");
}

function withFallback(values, fallback) {
  return values.length > 0 ? values : fallback;
}
