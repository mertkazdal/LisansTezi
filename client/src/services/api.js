import axios from "axios";
import {
  getDefaultGuestLimit,
  getGuestRemainingAnalyses,
  getGuestSessionId,
  resetGuestQuotaState,
  resetGuestSessionState,
  setGuestRemainingAnalyses,
} from "../lib/guestSession";

export const ACCESS_TOKEN_KEY = "access_token";
export const USER_KEY = "tezfinal_user";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

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

function polishDisplayText(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value || "";
  }

  return TURKISH_DISPLAY_REPLACEMENTS.reduce(
    (text, [source, replacement]) => text.replaceAll(source, replacement),
    value,
  );
}

function buildAppError(error) {
  const payload = error.response?.data ?? {};
  const appError = new Error(
    polishDisplayText(payload.message || payload.detail || payload.error?.message || "Bağlantı hatası. Lütfen tekrar dene."),
  );
  appError.code = payload.code || payload.error?.code || null;
  appError.status = error.response?.status || 500;
  appError.details = payload;
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
  return {
    historyId: data.historyId,
    emotion: data.emotion,
    confidence: data.confidence ?? 0,
    explanation: polishDisplayText(data.explanation || ""),
    needsReason: Boolean(data.needsReason),
    reasonProvided: data.reasonProvided !== false,
    followUpQuestion: polishDisplayText(data.followUpQuestion || ""),
    warning: polishDisplayText(data.warning || ""),
    modalityUsed: data.modalityUsed || "multimodal",
    modelUsed: data.modelUsed || "gemini-multimodal",
    responseTimeMs: data.responseTimeMs || null,
    faceDetected: Boolean(data.faceDetected),
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
      {
        ...data,
        guestSessionId: getGuestSessionId(),
      },
      { skipAuthClear: true },
    );
    const normalized = normalizeAuthResponse(response.data);
    resetGuestSessionState();
    return normalized;
  },

  async login(data) {
    const response = await api.post(
      "/api/auth/login",
      {
        ...data,
        guestSessionId: getGuestSessionId(),
      },
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
  async getHistory(page = 1, limit = 10) {
    const response = await api.get("/api/history", { params: { page, limit } });
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

  async deleteAccount(confirmationText = "DELETE") {
    const response = await api.delete("/api/user/account", {
      data: { confirmationText },
    });
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
};
