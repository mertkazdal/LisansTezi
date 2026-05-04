const GUEST_SESSION_KEY = "moodlens_guest_session_id";
const GUEST_REMAINING_KEY = "moodlens_guest_remaining";
const DEFAULT_GUEST_LIMIT = 3;

export function getGuestSessionId() {
  let guestSessionId = localStorage.getItem(GUEST_SESSION_KEY);
  if (!guestSessionId) {
    guestSessionId = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, guestSessionId);
  }
  return guestSessionId;
}

export function getGuestRemainingAnalyses() {
  const storedValue = localStorage.getItem(GUEST_REMAINING_KEY);
  if (storedValue === null) {
    return DEFAULT_GUEST_LIMIT;
  }

  const stored = Number(storedValue);
  return Number.isFinite(stored) && stored >= 0 ? stored : DEFAULT_GUEST_LIMIT;
}

export function setGuestRemainingAnalyses(value) {
  const normalized = Math.max(0, Number(value) || 0);
  localStorage.setItem(GUEST_REMAINING_KEY, String(normalized));
}

export function resetGuestQuotaState() {
  localStorage.removeItem(GUEST_REMAINING_KEY);
}

export function resetGuestSessionState() {
  localStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem(GUEST_REMAINING_KEY);
}

export function getDefaultGuestLimit() {
  return DEFAULT_GUEST_LIMIT;
}
