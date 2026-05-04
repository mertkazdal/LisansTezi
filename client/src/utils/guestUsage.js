import { guestSessionAPI } from "../services/api";

export const GUEST_ANALYSIS_LIMIT = guestSessionAPI.getDefaultGuestLimit();

export function getGuestAnalysisCount() {
  return Math.max(0, GUEST_ANALYSIS_LIMIT - guestSessionAPI.getGuestRemainingAnalyses());
}

export function incrementGuestAnalysisCount() {
  const nextCount = Math.min(GUEST_ANALYSIS_LIMIT, getGuestAnalysisCount() + 1);
  guestSessionAPI.setGuestRemainingAnalyses(Math.max(0, GUEST_ANALYSIS_LIMIT - nextCount));
  return nextCount;
}

export function getGuestAnalysesRemaining() {
  return guestSessionAPI.getGuestRemainingAnalyses();
}

export function hasReachedGuestLimit() {
  return getGuestAnalysesRemaining() <= 0;
}
