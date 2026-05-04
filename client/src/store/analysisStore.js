import { create } from "zustand";
import { emotionAPI } from "../services/api";

const useAnalysisStore = create((set, get) => ({
  isAnalyzing: false,
  analysisResult: null,
  recommendations: null,
  error: null,

  analyzeEmotion: async (payload) => {
    set({ isAnalyzing: true, error: null, analysisResult: null });

    try {
      const result = await emotionAPI.analyze(payload);
      set({
        analysisResult: result,
        recommendations: result.recommendations,
        isAnalyzing: false,
      });
      return result;
    } catch (err) {
      set({ error: err.message || "Analiz sirasinda hata olustu", isAnalyzing: false });
      return null;
    }
  },

  getRecommendations: async (historyId) => {
    try {
      const result = await emotionAPI.getRecommendations(historyId);
      set({ recommendations: result });
      return result;
    } catch (err) {
      set({ error: err.message || "Oneriler alinmadi" });
      return null;
    }
  },

  reset: () =>
    set({
      isAnalyzing: false,
      analysisResult: null,
      recommendations: null,
      error: null,
    }),
}));

export default useAnalysisStore;
