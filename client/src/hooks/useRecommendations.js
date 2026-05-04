import { useEffect, useState } from "react";
import { emotionAPI } from "../services/api";

export function useRecommendations(historyId) {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      if (!historyId) {
        setRecommendations(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await emotionAPI.getRecommendations(historyId);
        if (!cancelled) {
          setRecommendations(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Oneriler yuklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [historyId]);

  return { recommendations, isLoading, error };
}
