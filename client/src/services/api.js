import axios from "axios";
import {
  clearAnalysisCooldown,
  getAnalysisCooldownRemainingSeconds,
  getDefaultGuestLimit,
  getGuestRemainingAnalyses,
  getGuestSessionId,
  resetGuestQuotaState,
  resetGuestSessionState,
  setAnalysisCooldown,
  setGuestRemainingAnalyses,
} from "../lib/guestSession";

export const ACCESS_TOKEN_KEY = "access_token";
export const USER_KEY = "tezfinal_user";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

const USER_FRIENDLY_ANALYZE_ERROR_MESSAGES_TR = {
  UNSUPPORTED_IMAGE_TYPE: "Bu dosya formatı desteklenmiyor. Lütfen JPG, PNG veya WebP formatında bir fotoğraf yükle.",
  UNSUPPORTED_IMAGE_MIME_TYPE: "Bu dosya formatı desteklenmiyor. Lütfen JPG, PNG veya WebP formatında bir fotoğraf yükle.",
  INVALID_IMAGE: "Fotoğraf okunamadı. Lütfen farklı bir görsel dene.",
  IMAGE_TOO_LARGE: "Fotoğraf boyutu çok büyük. Maksimum 10 MB yükleyebilirsin.",
  NO_FACE_DETECTED: "Fotoğrafta yüz bulunamadı. Lütfen yüzün net göründüğü bir selfie yükle.",
  MULTIPLE_FACES_DETECTED: "Fotoğrafta birden fazla yüz var. Lütfen yalnızca senin yüzünün göründüğü bir fotoğraf yükle.",
  FACE_TOO_SMALL: "Yüzün kadrajda çok küçük görünüyor. Biraz yaklaşarak tekrar dene.",
  FACE_MODEL_UNAVAILABLE: "Görsel analiz şu an kullanılamıyor. Metin ile devam edebilirsin.",
  IMAGE_UNPROCESSABLE: "Görsel işlenemedi. Metin ekleyerek analizi tamamlayabilirsin.",
  AI_INVALID_RESPONSE: "Analiz sırasında bir sorun oluştu. Lütfen tekrar dene.",
  AI_PROVIDER_ERROR: "Analiz servisi şu an yanıt veremiyor. Lütfen biraz sonra tekrar dene.",
  AI_SERVICE_UNAVAILABLE: "AI servisine ulaşılamıyor. Lütfen biraz sonra tekrar dene.",
  ANALYSIS_FAILED_BEFORE_EMOTION: "Duygu sonucu üretilemeden analiz durdu. Lütfen tekrar dene.",
  ANALYSIS_UNEXPECTED_ERROR: "Analiz sırasında beklenmeyen bir sorun oluştu. Lütfen tekrar dene.",
  ANALYSIS_INPUT_REQUIRED: "Analize başlamak için metin, selfie ya da ikisinden birini ekle.",
  MISSING_INPUT: "Analize başlamak için metin, selfie ya da ikisinden birini ekle.",
  MISSING_CONSENT: "Selfie kullanmadan önce mahremiyet onayını işaretle.",
  INVALID_TEXT_LENGTH: "Metin 10 ile 1000 karakter arasında olmalı.",
  AGE_REQUIRED: "Analize başlamadan önce yaşını girmen gerekiyor. Önerileri yaşına uygun hazırlayacağız.",
  INVALID_AGE: "Yaş 13 ile 120 arasında olmalı.",
  SURVEY_REQUIRED: "Analize başlamadan önce kısa bir anket doldurman gerekiyor. Bu anket sana özel sonuçlar üretmemizi sağlıyor.",
  survey_required: "Analize başlamadan önce kısa bir anket doldurman gerekiyor. Bu anket sana özel sonuçlar üretmemizi sağlıyor.",
  GUEST_QUOTA_EXCEEDED: "3 analiz hakkını kullandın. Devam etmek için ücretsiz hesap oluşturabilirsin.",
  ANALYSIS_RETRY_COOLDOWN: "Analizin tutarsız sinyaller içeriyor. 1 dakika sonra tekrar deneyebilirsin.",
  ANALYSIS_COOLDOWN_ACTIVE: "Analizin tutarsız sinyaller içeriyor. 1 dakika sonra tekrar deneyebilirsin.",
  AUTHENTICATION_REQUIRED: "Oturumun sona erdi. Lütfen tekrar giriş yap.",
};

const PARTIAL_ANALYSIS_MESSAGE_TR =
  "Analizin tamamlandı! Ancak bazı öneriler şu an getirilemedi. Duygu durumun ve koç tavsiyesi aşağıda hazır.";

function getStoredToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getPreferredLanguage() {
  const stored = localStorage.getItem("language");
  if (stored === "tr" || stored === "en") {
    return stored;
  }
  return navigator.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const TURKISH_DISPLAY_REPLACEMENTS = [
  ["goruluyor", "görülüyor"],
  ["Goruluyor", "Görülüyor"],
  ["gore", "göre"],
  ["Gore", "Göre"],
  ["secimi", "seçimi"],
  ["Secimi", "Seçimi"],
  ["secilen", "seçilen"],
  ["Secilen", "Seçilen"],
  ["secildi", "seçildi"],
  ["Secildi", "Seçildi"],
  ["parca", "parça"],
  ["Parca", "Parça"],
  ["eslesebilir", "eşleşebilir"],
  ["Eslesebilir", "Eşleşebilir"],
  ["yavaslat", "yavaşlat"],
  ["Yavaslat", "Yavaşlat"],
  ["kazandirabilir", "kazandırabilir"],
  ["Kazandirabilir", "Kazandırabilir"],
  ["cumleyle", "cümleyle"],
  ["Cumleyle", "Cümleyle"],
  ["yogunlugu", "yoğunluğu"],
  ["Yogunlugu", "Yoğunluğu"],
  ["Kucuk", "Küçük"],
  ["kucuk", "küçük"],
  ["bugun", "bugün"],
  ["Bugun", "Bugün"],
];

const TURKISH_DISPLAY_REGEX_REPLACEMENTS = [
  [/\bmuzik\b/g, "müzik"],
  [/\bMuzik\b/g, "Müzik"],
  [/\bsans\b/g, "şans"],
  [/\bSans\b/g, "Şans"],
  [/\bkagit\b/g, "kağıt"],
  [/\bKagit\b/g, "Kağıt"],
  [/\bkagıt\b/g, "kağıt"],
  [/\bKagıt\b/g, "Kağıt"],
  [/\byasam kocu\b/g, "yaşam koçu"],
  [/\bYasam Kocu\b/g, "Yaşam Koçu"],
  [/\boneriler\b/g, "öneriler"],
  [/\bOneriler\b/g, "Öneriler"],
  [/\balinmadi\b/g, "alınmadı"],
  [/\byuklenemedi\b/g, "yüklenemedi"],
  [/\bdegil\b/g, "değil"],
  [/\bgorsel\b/g, "görsel"],
  [/\bGorsel\b/g, "Görsel"],
  [/\byuz\b/g, "yüz"],
  [/\bYuz\b/g, "Yüz"],
  [/\bhazir\b/g, "hazır"],
  [/\bHazir\b/g, "Hazır"],
  [/\blutfen\b/g, "lütfen"],
  [/\bLutfen\b/g, "Lütfen"],
  [/\bfotografi\b/g, "fotoğrafı"],
  [/\bFotografi\b/g, "Fotoğrafı"],
  [/\bcek\b/g, "çek"],
  [/\bislenemedi\b/g, "işlenemedi"],
  [/\bgorunen\b/g, "görünen"],
  [/\baydinlik\b/g, "aydınlık"],
  [/\byaklasik\b/g, "yaklaşık"],
];

function polishDisplayText(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value || "";
  }

  const plainText = TURKISH_DISPLAY_REPLACEMENTS.reduce(
    (text, [source, replacement]) => text.replaceAll(source, replacement),
    value,
  );

  return TURKISH_DISPLAY_REGEX_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    plainText,
  );
}

function resolveFriendlyErrorMessage(error) {
  const payload = error.response?.data ?? {};
  const status = error.response?.status || 500;
  const code = payload.code || payload.error?.code || null;
  const rawMessage = payload.message || payload.detail || payload.error?.message || "";
  const normalizedCode = String(code || rawMessage || "").trim();
  const requestUrl = String(error.config?.url || "");
  const isAnalyzeRequest = requestUrl.includes("/api/analyze") || requestUrl.includes("/validate-image");
  const isMetricsRequest = requestUrl.includes("/api/metrics") || requestUrl.includes("/api/admin");

  if (status === 401) {
    return "Oturumun sona erdi. Lütfen tekrar giriş yap.";
  }

  if (status === 403 && isMetricsRequest) {
    return "Sistem analizlerini görmek için yönetici yetkisi gerekiyor.";
  }

  if (
    isAnalyzeRequest &&
    status === 403 &&
    (normalizedCode === "GUEST_QUOTA_EXCEEDED" || payload.guestRemainingAnalyses === 0)
  ) {
    return USER_FRIENDLY_ANALYZE_ERROR_MESSAGES_TR.GUEST_QUOTA_EXCEEDED;
  }

  if (isAnalyzeRequest && USER_FRIENDLY_ANALYZE_ERROR_MESSAGES_TR[normalizedCode]) {
    return USER_FRIENDLY_ANALYZE_ERROR_MESSAGES_TR[normalizedCode];
  }

  if (isAnalyzeRequest && status === 503) {
    return USER_FRIENDLY_ANALYZE_ERROR_MESSAGES_TR.AI_SERVICE_UNAVAILABLE;
  }

  return polishDisplayText(rawMessage || "Bağlantı hatası. Lütfen tekrar dene.");
}

function buildAppError(error) {
  const payload = error.response?.data ?? {};
  const appError = new Error(resolveFriendlyErrorMessage(error));
  appError.code = payload.code || payload.error?.code || null;
  appError.status = error.response?.status || 500;
  appError.details = payload;
  appError.retryAfterSeconds =
    typeof payload.retryAfterSeconds === "number"
      ? payload.retryAfterSeconds
      : null;
  return appError;
}

function normalizeAuthResponse(data) {
  return {
    token: data.token,
    user: {
      id: data.userId,
      username: data.username,
      email: data.email,
      role: data.role || (data.isAdmin ? "admin" : "user"),
      isAdmin: Boolean(data.isAdmin),
      recommendationSurvey: data.recommendationSurvey || null,
      preferredColorTheme: data.preferredColorTheme || null,
    },
    guestDataMerged: Boolean(data.guestDataMerged),
    migratedGuestAnalysesCount: data.migratedGuestAnalysesCount || 0,
  };
}

function normalizeMusicItem(item) {
  return {
    title: polishDisplayText(item.title || "Bilinmeyen parça"),
    artist: polishDisplayText(item.artist || item.artists || "Bilinmeyen sanatçı"),
    coverUrl: item.cover_url || item.image || null,
    externalUrl: item.spotify_url || item.url || null,
    reason: polishDisplayText(item.reason || ""),
  };
}

function normalizeMovieItem(item) {
  return {
    title: polishDisplayText(item.title || "Bilinmeyen film"),
    posterUrl: item.poster_url || item.poster || null,
    overview: polishDisplayText(item.overview || item.description || ""),
    rating: item.rating || item.vote_average || null,
    year: item.year || item.release_date?.slice(0, 4) || "",
    externalUrl: item.tmdb_url || item.link || null,
    reason: polishDisplayText(item.reason || ""),
  };
}

function normalizeBookItem(item) {
  const author = Array.isArray(item.authors)
    ? item.authors.join(", ")
    : item.author || item.authors || "Bilinmeyen yazar";

  return {
    title: polishDisplayText(item.title || "Bilinmeyen kitap"),
    author: polishDisplayText(author),
    coverUrl: item.cover_url || item.thumbnail || null,
    externalUrl: item.books_url || item.link || null,
    reason: polishDisplayText(item.reason || ""),
  };
}

function normalizeAdviceItem(item, index) {
  return {
    id: item.id || `advice-${index}`,
    title: polishDisplayText(item.title || item.category || "Kısa tavsiye"),
    description: polishDisplayText(item.description || item.text || ""),
    icon: item.icon || "AI",
  };
}

function normalizeFeedback(data) {
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    historyId: data.historyId,
    overallRating: data.overallRating || 0,
    analysisAccuracyRating: data.analysisAccuracyRating || 0,
    recommendationQualityRating: data.recommendationQualityRating || 0,
    helpful: Boolean(data.helpful),
    wouldReuse: Boolean(data.wouldReuse),
    comment: data.comment || "",
    createdAt: data.createdAt || null,
  };
}

function normalizeRecommendations(payload) {
  const source = payload?.recommendations ?? payload ?? {};

  return {
    music: (source.music || []).map(normalizeMusicItem),
    movie: (source.movie || source.movies || []).map(normalizeMovieItem),
    book: (source.book || source.books || []).map(normalizeBookItem),
    advice: (source.advice || source.lifeAdvice || []).map(normalizeAdviceItem),
  };
}

function normalizeAnalysisResponse(data) {
  const isPartial = data.status === "partial";
  return {
    historyId: data.historyId,
    emotion: data.emotion,
    confidence: data.confidence ?? 0,
    explanation: polishDisplayText(data.explanation || ""),
    needsReason: Boolean(data.needsReason),
    reasonProvided: data.reasonProvided !== false,
    followUpQuestion: polishDisplayText(data.followUpQuestion || ""),
    warning: isPartial ? PARTIAL_ANALYSIS_MESSAGE_TR : polishDisplayText(data.warning || ""),
    modalityUsed: data.modalityUsed || "multimodal",
    modelUsed: data.modelUsed || "gemini-multimodal",
    responseTimeMs: data.responseTimeMs || null,
    faceDetected: Boolean(data.faceDetected),
    contradictionDetected: Boolean(data.contradictionDetected || data.conflict_detected || data.contradiction_detected),
    status: data.status || "complete",
    partialError: polishDisplayText(data.partialError || data.partial_error || ""),
    missingRecommendations: data.missingRecommendations || data.missing_recommendations || [],
    askAvatarRefresh: Boolean(data.askAvatarRefresh || data.ask_avatar_refresh),
    guestRemainingAnalyses:
      typeof data.guestRemainingAnalyses === "number"
        ? data.guestRemainingAnalyses
        : getGuestRemainingAnalyses(),
    recommendations: normalizeRecommendations(data),
    feedback: normalizeFeedback(data.feedback),
  };
}

function normalizeHistoryItem(item) {
  return {
    id: item.id,
    emotion: item.detectedEmotion || "calm",
    confidence: item.confidence ?? 0,
    explanation: polishDisplayText(item.explanation || ""),
    userText: item.userText || "",
    createdAt: item.createdAt,
    modalityUsed: item.modalityUsed || "multimodal",
    modelUsed: item.modelUsed || "gemini-multimodal",
    responseTimeMs: item.responseTimeMs || null,
    faceDetected: Boolean(item.faceDetected),
  };
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-MoodLens-Language"] = getPreferredLanguage();
  config.headers["X-Guest-Session-Id"] = getGuestSessionId();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthClear) {
      clearStoredSession();
    }

    if (error.response?.data?.code === "GUEST_QUOTA_EXCEEDED") {
      setGuestRemainingAnalyses(0);
    }

    return Promise.reject(buildAppError(error));
  },
);

export const authAPI = {
  async register(data) {
    const response = await api.post(
      "/api/auth/register",
      data,
      { skipAuthClear: true },
    );
    const normalized = normalizeAuthResponse(response.data);
    resetGuestSessionState();
    return normalized;
  },

  async login(data) {
    const response = await api.post(
      "/api/auth/login",
      data,
      { skipAuthClear: true },
    );
    const normalized = normalizeAuthResponse(response.data);
    resetGuestSessionState();
    return normalized;
  },
};

export const emotionAPI = {
  async analyze(payload) {
    const response = await api.post(
      "/api/analyze",
      {
        ...payload,
        guestSessionId: getGuestSessionId(),
      },
      { skipAuthClear: true },
    );

    const normalized = normalizeAnalysisResponse(response.data);
    if (typeof normalized.guestRemainingAnalyses === "number") {
      setGuestRemainingAnalyses(normalized.guestRemainingAnalyses);
    }

    return normalized;
  },

  async getRecommendations(historyId) {
    const response = await api.get(`/api/recommendations/${historyId}`, {
      params: { guestSessionId: getGuestSessionId() },
      skipAuthClear: true,
    });
    return normalizeAnalysisResponse(response.data);
  },
};

export const historyAPI = {
  async getHistory(page = 1, limit = 10, emotion = "all") {
    const params = { page, limit };
    if (emotion && emotion !== "all") {
      params.emotion = emotion;
    }

    const response = await api.get("/api/history", { params });
    return {
      items: (response.data.items || []).map(normalizeHistoryItem),
      total: response.data.total || 0,
      page: response.data.page || page,
      limit: response.data.limit || limit,
      totalPages: response.data.totalPages || 0,
    };
  },

  async getHistoryItem(id) {
    const response = await api.get(`/api/history/${id}`);
    return normalizeHistoryItem(response.data);
  },
};

export const userAPI = {
  async getProfile() {
    const response = await api.get("/api/user/profile");
    return response.data;
  },

  async generateAvatar() {
    const response = await api.post("/api/profile/generate-avatar", {});
    return {
      avatarUrl: response.data.avatar_url || response.data.avatarUrl || "",
      cached: Boolean(response.data.cached),
    };
  },

  async updateColorTheme(colorTheme) {
    const response = await api.put("/api/user/theme", { colorTheme });
    return response.data;
  },

  async deleteAccount(confirmationText = "DELETE") {
    const response = await api.delete("/api/user/account", {
      data: { confirmationText },
    });
    return response.data;
  },
};

export const spotifyAPI = {
  async getStatus() {
    const response = await api.get("/api/spotify/status");
    return response.data;
  },

  async getConnectUrl() {
    const response = await api.get("/api/spotify/auth-url");
    return response.data;
  },
};

export const metricsAPI = {
  async getDashboard() {
    const response = await api.get("/api/metrics/dashboard");
    return response.data;
  },

  async getResearch() {
    const response = await api.get("/api/metrics/research");
    return response.data;
  },

  async getComparison() {
    const response = await api.get("/api/metrics/comparison");
    return response.data;
  },

  async getResponseTimes() {
    const response = await api.get("/api/metrics/response-times");
    return response.data;
  },

  async getEmotionDistribution() {
    const response = await api.get("/api/metrics/emotion-distribution");
    return response.data;
  },
};

export const feedbackAPI = {
  async submit(historyId, data) {
    const response = await api.post(`/api/feedback/${historyId}`, data, {
      params: { guestSessionId: getGuestSessionId() },
      skipAuthClear: true,
    });
    return {
      message: response.data.message,
      feedback: normalizeFeedback(response.data.feedback),
    };
  },

  async get(historyId) {
    const response = await api.get(`/api/feedback/${historyId}`, {
      params: { guestSessionId: getGuestSessionId() },
      skipAuthClear: true,
    });
    return normalizeFeedback(response.data);
  },
};

export const adminAPI = {
  async getOverview() {
    const response = await api.get("/api/admin/overview");
    return response.data;
  },

  async downloadExportCsv() {
    const response = await api.get("/api/admin/export/csv", {
      responseType: "blob",
    });
    const contentDisposition = response.headers["content-disposition"] || "";
    const matchedFileName = contentDisposition.match(/filename="?([^"]+)"?/i);
    return {
      blob: response.data,
      fileName: matchedFileName?.[1] || "yasam-kocu-metrics.csv",
    };
  },
};

export const guestSessionAPI = {
  getGuestSessionId,
  getGuestRemainingAnalyses,
  setGuestRemainingAnalyses,
  getDefaultGuestLimit,
  resetGuestQuotaState,
  resetGuestSessionState,
  getAnalysisCooldownRemainingSeconds,
  setAnalysisCooldown,
  clearAnalysisCooldown,
};
