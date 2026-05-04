import emotionContract from "../../../shared/emotion_contract.json" with { type: "json" };

const DEFAULT_RESULT_META = {
  auraFrom: "rgba(45, 212, 191, 0.24)",
  auraTo: "rgba(99, 102, 241, 0.2)",
  softAccent: "rgba(45, 212, 191, 0.12)",
  resultTone: "Dengeli ve kişisel bir analiz sonucu hazırlandı.",
  coachPrompt: "Bugünkü ritmini daha iyi anlamak için küçük ve uygulanabilir bir adım seçebilirsin.",
};

const CONTRACT_ENTRIES = Array.isArray(emotionContract?.emotions) ? emotionContract.emotions : [];
const CONTRACT_BY_KEY = Object.fromEntries(CONTRACT_ENTRIES.map((entry) => [entry.key, entry]));

export const EMOTION_META = {
  happy: {
    key: "happy",
    label: "Mutlu",
    emoji: "😊",
    accentColor: "#f59e0b",
    gradientFrom: "from-amber-50",
    gradientTo: "to-yellow-50",
    borderColor: "border-amber-200",
    message: "Pozitif bir enerji taşıyorsun. Bu hissi koruyacak seçimler iyi gelebilir.",
    auraFrom: "rgba(245, 158, 11, 0.32)",
    auraTo: "rgba(45, 212, 191, 0.22)",
    softAccent: "rgba(245, 158, 11, 0.14)",
    resultTone: "Enerjin yükselmiş görünüyor; bu modu besleyen öneriler öne çıkarıldı.",
    coachPrompt: "Bu iyi hali büyütmek için gününe küçük bir kutlama veya üretken bir ritüel ekleyebilirsin.",
  },
  sad: {
    key: "sad",
    label: "Üzgün",
    emoji: "😔",
    accentColor: "#3b82f6",
    gradientFrom: "from-blue-50",
    gradientTo: "to-sky-50",
    borderColor: "border-blue-200",
    message: "Kendine biraz alan açmak ve daha yavaş ilerlemek iyi gelebilir.",
    auraFrom: "rgba(59, 130, 246, 0.28)",
    auraTo: "rgba(14, 165, 233, 0.16)",
    softAccent: "rgba(59, 130, 246, 0.13)",
    resultTone: "Daha sakin ve destekleyici bir akış senin için önceliklendirildi.",
    coachPrompt: "Bugün kendinden yüksek performans beklemek yerine güvenli bir alan açmayı deneyebilirsin.",
  },
  angry: {
    key: "angry",
    label: "Öfkeli",
    emoji: "😠",
    accentColor: "#ef4444",
    gradientFrom: "from-red-50",
    gradientTo: "to-rose-50",
    borderColor: "border-red-200",
    message: "Yoğun bir enerji var. Güvenli şekilde boşaltmak ve netleşmek önemli olabilir.",
    auraFrom: "rgba(239, 68, 68, 0.28)",
    auraTo: "rgba(244, 63, 94, 0.18)",
    softAccent: "rgba(239, 68, 68, 0.12)",
    resultTone: "Yoğun enerjiyi düzenlemeye yardımcı olacak öneriler seçildi.",
    coachPrompt: "Tepki vermeden önce kısa bir yürüyüş, nefes arası veya not alma iyi gelebilir.",
  },
  anxious: {
    key: "anxious",
    label: "Endişeli",
    emoji: "😰",
    accentColor: "#8b5cf6",
    gradientFrom: "from-violet-50",
    gradientTo: "to-purple-50",
    borderColor: "border-violet-200",
    message: "Zihnin hızlı çalışıyor olabilir. Daha yumuşak ve sakinleştirici seçimler iyi eşleşir.",
    auraFrom: "rgba(139, 92, 246, 0.3)",
    auraTo: "rgba(56, 189, 248, 0.16)",
    softAccent: "rgba(139, 92, 246, 0.13)",
    resultTone: "Zihinsel yükü azaltan, netlik ve sakinlik veren öneriler öne alındı.",
    coachPrompt: "Kontrol edebildiğin tek küçük adımı seçmek bugün sistemi rahatlatabilir.",
  },
  excited: {
    key: "excited",
    label: "Heyecanlı",
    emoji: "🤩",
    accentColor: "#ec4899",
    gradientFrom: "from-pink-50",
    gradientTo: "to-rose-50",
    borderColor: "border-pink-200",
    message: "Yüksek enerji ve merak duygusu baskın. Bunu besleyen öneriler öne çıkıyor.",
    auraFrom: "rgba(236, 72, 153, 0.3)",
    auraTo: "rgba(245, 158, 11, 0.2)",
    softAccent: "rgba(236, 72, 153, 0.12)",
    resultTone: "Hareketli, ilham verici ve merakını besleyen içerikler seçildi.",
    coachPrompt: "Bu enerjiyi dağıtmadan önce net bir hedefe bağlamak sana iyi gelebilir.",
  },
  calm: {
    key: "calm",
    label: "Sakin",
    emoji: "😌",
    accentColor: "#14b8a6",
    gradientFrom: "from-teal-50",
    gradientTo: "to-emerald-50",
    borderColor: "border-teal-200",
    message: "Dengeli bir ritimdesin. Derinlikli ve huzurlu içerikler sana iyi gelebilir.",
    auraFrom: "rgba(20, 184, 166, 0.28)",
    auraTo: "rgba(34, 197, 94, 0.16)",
    softAccent: "rgba(20, 184, 166, 0.12)",
    resultTone: "Dengeyi koruyan ve zihinsel alan açan öneriler önceliklendirildi.",
    coachPrompt: "Bu sakinliği korumak için günün bir bölümünü bilinçli yavaşlatabilirsin.",
  },
  tired: {
    key: "tired",
    label: "Yorgun",
    emoji: "🥱",
    accentColor: "#64748b",
    gradientFrom: "from-slate-50",
    gradientTo: "to-gray-50",
    borderColor: "border-slate-200",
    message: "Enerjin düşük görünüyor. Hafif, yumuşak ve dinlendirici öneriler daha uygun olabilir.",
    auraFrom: "rgba(100, 116, 139, 0.24)",
    auraTo: "rgba(59, 130, 246, 0.12)",
    softAccent: "rgba(148, 163, 184, 0.13)",
    resultTone: "Daha hafif, düşük eforlu ve toparlayıcı öneriler seçildi.",
    coachPrompt: "Bugün ilerlemekten çok toparlanmaya izin vermek daha doğru olabilir.",
  },
  stressed: {
    key: "stressed",
    label: "Stresli",
    emoji: "😵",
    accentColor: "#f97316",
    gradientFrom: "from-orange-50",
    gradientTo: "to-amber-50",
    borderColor: "border-orange-200",
    message: "Yük birikimi hissi var. Rahatlatan ve odak toparlayan seçimler iyi gelebilir.",
    auraFrom: "rgba(249, 115, 22, 0.3)",
    auraTo: "rgba(244, 63, 94, 0.16)",
    softAccent: "rgba(249, 115, 22, 0.12)",
    resultTone: "Yükü azaltan, odağı toparlayan ve nefes aldıran öneriler öne çıkarıldı.",
    coachPrompt: "Büyük resmi çözmeye çalışmadan önce tek bir küçük alanı sadeleştirmeyi deneyebilirsin.",
  },
  nostalgic: {
    key: "nostalgic",
    label: "Nostaljik",
    emoji: "🥹",
    accentColor: "#6366f1",
    gradientFrom: "from-indigo-50",
    gradientTo: "to-violet-50",
    borderColor: "border-indigo-200",
    message: "Geçmişe dokunan bir duygusal ton var. Tanıdık ve sıcak hissettiren öneriler uygun olabilir.",
    auraFrom: "rgba(99, 102, 241, 0.3)",
    auraTo: "rgba(245, 158, 11, 0.14)",
    softAccent: "rgba(99, 102, 241, 0.12)",
    resultTone: "Tanıdık, sıcak ve geçmişle bağ kuran öneriler seçildi.",
    coachPrompt: "Bu hissi bastırmak yerine sana neyi hatırlattığını kısa bir notla yakalayabilirsin.",
  },
  motivated: {
    key: "motivated",
    label: "Motive",
    emoji: "🚀",
    accentColor: "#22c55e",
    gradientFrom: "from-lime-50",
    gradientTo: "to-green-50",
    borderColor: "border-lime-200",
    message: "Hareket etmeye hazır bir moddasın. Seni ileri taşıyacak seçimler iyi eşleşir.",
    auraFrom: "rgba(34, 197, 94, 0.3)",
    auraTo: "rgba(45, 212, 191, 0.2)",
    softAccent: "rgba(34, 197, 94, 0.12)",
    resultTone: "İleri taşıyan, odak veren ve ritmini yükselten öneriler hazırlandı.",
    coachPrompt: "Bu motivasyonu somutlaştırmak için bugün bitirebileceğin tek işi seçebilirsin.",
  },
  hopeful: {
    key: "hopeful",
    label: "Umutlu",
    emoji: "🌤️",
    accentColor: "#0ea5e9",
    gradientFrom: "from-cyan-50",
    gradientTo: "to-sky-50",
    borderColor: "border-cyan-200",
    message: "Yeni bir şeyin mümkün olduğuna dair bir his var. Bu tonu besleyen içerikler destek olabilir.",
    auraFrom: "rgba(14, 165, 233, 0.3)",
    auraTo: "rgba(34, 197, 94, 0.16)",
    softAccent: "rgba(14, 165, 233, 0.12)",
    resultTone: "Umut hissini güçlendiren ve nazikçe ileri baktıran öneriler seçildi.",
    coachPrompt: "Bugün geleceğe dair küçük ama gerçekçi bir işaret bırakmak iyi gelebilir.",
  },
  overwhelmed: {
    key: "overwhelmed",
    label: "Bunalmış",
    emoji: "🫠",
    accentColor: "#a855f7",
    gradientFrom: "from-fuchsia-50",
    gradientTo: "to-purple-50",
    borderColor: "border-fuchsia-200",
    message: "Çok fazla uyaran üst üste geliyor olabilir. Daha sade ve nefes aldıran öneriler daha iyi gelebilir.",
    auraFrom: "rgba(168, 85, 247, 0.3)",
    auraTo: "rgba(59, 130, 246, 0.14)",
    softAccent: "rgba(168, 85, 247, 0.12)",
    resultTone: "Sadeleşmeyi, nefes almayı ve yük azaltmayı destekleyen öneriler seçildi.",
    coachPrompt: "Her şeyi çözmeye çalışmadan önce sadece bir yükü masadan kaldırmayı deneyebilirsin.",
  },
};

const EMOTION_TRANSLATIONS = {
  en: {
    happy: { label: "Happy", message: "You are carrying positive energy. Choices that help you protect this feeling may support you.", resultTone: "Your energy looks elevated; recommendations that nurture this mode were prioritized.", coachPrompt: "To grow this good state, you can add a small celebration or productive ritual to your day." },
    sad: { label: "Sad", message: "Giving yourself some space and moving more slowly may help.", resultTone: "A calmer and more supportive flow was prioritized for you.", coachPrompt: "Instead of expecting high performance today, you can create a safer emotional space for yourself." },
    angry: { label: "Angry", message: "There is intense energy here. Releasing it safely and gaining clarity may matter.", resultTone: "Recommendations were selected to help regulate intense energy.", coachPrompt: "Before reacting, a short walk, breathing pause, or note-taking moment may help." },
    anxious: { label: "Anxious", message: "Your mind may be moving fast. Softer, calming choices can be a better match.", resultTone: "Recommendations that reduce mental load and support clarity were prioritized.", coachPrompt: "Choosing one small controllable step can help your system settle today." },
    excited: { label: "Excited", message: "High energy and curiosity are present. Recommendations that feed this state stand out.", resultTone: "Lively, inspiring content that supports your curiosity was selected.", coachPrompt: "Before spreading this energy too widely, tying it to a clear goal may help." },
    calm: { label: "Calm", message: "You are in a balanced rhythm. Peaceful and reflective content may suit you well.", resultTone: "Recommendations that preserve balance and open mental space were prioritized.", coachPrompt: "You can protect this calm by intentionally slowing down one part of your day." },
    tired: { label: "Tired", message: "Your energy seems low. Gentle, light, restorative recommendations may be more suitable.", resultTone: "Lighter, lower-effort and restorative recommendations were selected.", coachPrompt: "Today, allowing recovery instead of pushing forward may be the wiser move." },
    stressed: { label: "Stressed", message: "There is a sense of accumulated load. Choices that restore focus and relief may help.", resultTone: "Recommendations that reduce load, restore focus, and create breathing room were prioritized.", coachPrompt: "Before solving the whole picture, try simplifying one small area first." },
    nostalgic: { label: "Nostalgic", message: "There is an emotional tone connected to the past. Warm and familiar recommendations may fit.", resultTone: "Warm, familiar recommendations that connect with memory were selected.", coachPrompt: "Instead of pushing this feeling away, you can capture what it reminds you of in a short note." },
    motivated: { label: "Motivated", message: "You seem ready to move. Choices that carry you forward are a strong match.", resultTone: "Focused recommendations that lift your rhythm and move you forward were prepared.", coachPrompt: "To make this motivation concrete, choose one task you can finish today." },
    hopeful: { label: "Hopeful", message: "There is a feeling that something new is possible. Content that supports this tone may help.", resultTone: "Recommendations that strengthen hope and gently look forward were selected.", coachPrompt: "Leaving one small but realistic sign for your future self may feel good today." },
    overwhelmed: { label: "Overwhelmed", message: "Too many signals may be arriving at once. Simpler, spacious recommendations may fit better.", resultTone: "Recommendations that support simplicity, breathing room, and load reduction were selected.", coachPrompt: "Before trying to solve everything, try removing just one load from the table." }
  }
};

export function getEmotionMeta(emotionKey, languageOrOptions = "tr") {
  const language = normalizeLanguage(languageOrOptions);
  if (!emotionKey) {
    return localizeEmotionMeta({
      key: "unknown",
      label: "Belirsiz",
      emoji: "🙂",
      accentColor: "#6b7280",
      gradientFrom: "from-gray-50",
      gradientTo: "to-slate-50",
      borderColor: "border-gray-200",
      message: "Duygu tonu net değil ama sistem yine de sana uygun öneriler hazırladı.",
      ...DEFAULT_RESULT_META,
    }, language);
  }

  const normalized = String(emotionKey).toLowerCase().trim();
  const fallback = {
    key: normalized,
    label: normalized.replace(/_/g, " "),
    emoji: "🙂",
    accentColor: "#6b7280",
    gradientFrom: "from-gray-50",
    gradientTo: "to-slate-50",
    borderColor: "border-gray-200",
    message: "Arayüz yeni duygulara açık şekilde tasarlandı.",
    ...DEFAULT_RESULT_META,
  };

  return localizeEmotionMeta(EMOTION_META[normalized] ?? fallback, language);
}

function normalizeLanguage(languageOrOptions) {
  if (typeof languageOrOptions === "string") {
    return languageOrOptions;
  }

  return languageOrOptions?.language || "tr";
}

function localizeEmotionMeta(meta, language) {
  if (!String(language || "tr").startsWith("en")) {
    return {
      ...meta,
      label: getContractLabel(meta.key, "tr") ?? meta.label,
    };
  }

  if (meta.key === "unknown") {
    return {
      ...meta,
      label: "Unknown",
      message: "The emotional tone is not fully clear, but the system still prepared suitable recommendations.",
      resultTone: "A balanced and personal analysis result was prepared.",
      coachPrompt: "To better understand today's rhythm, you can choose one small and practical step.",
    };
  }

  const localized = EMOTION_TRANSLATIONS.en[meta.key];
  return localized ? {
    ...meta,
    ...localized,
    label: getContractLabel(meta.key, "en") ?? localized.label ?? meta.label,
  } : {
    ...meta,
    label: getContractLabel(meta.key, "en") ?? meta.label,
    message: "The interface is designed to handle new emotions safely.",
    resultTone: "A balanced and personal analysis result was prepared.",
    coachPrompt: "To better understand today's rhythm, you can choose one small and practical step.",
  };
}

function getContractLabel(key, language = "tr") {
  const entry = CONTRACT_BY_KEY[key];
  if (!entry?.labels) {
    return null;
  }

  if (String(language || "tr").startsWith("en")) {
    return entry.labels.en ?? entry.labels.tr ?? null;
  }

  return entry.labels.tr ?? entry.labels.en ?? null;
}

export function getEmotionOptions(languageOrOptions = "tr") {
  const language = normalizeLanguage(languageOrOptions);
  if (!CONTRACT_ENTRIES.length) {
    return Object.values(EMOTION_META).map((emotion) => localizeEmotionMeta(emotion, language));
  }

  return CONTRACT_ENTRIES.map((entry) => {
    const fallback = {
      key: entry.key,
      label: getContractLabel(entry.key, language) ?? entry.key,
      emoji: "ğŸ™‚",
      accentColor: "#6b7280",
      gradientFrom: "from-gray-50",
      gradientTo: "to-slate-50",
      borderColor: "border-gray-200",
      message: "ArayÃ¼z yeni duygulara aÃ§Ä±k ÅŸekilde tasarlandÄ±.",
      ...DEFAULT_RESULT_META,
    };

    return localizeEmotionMeta(EMOTION_META[entry.key] ?? fallback, language);
  });
}
