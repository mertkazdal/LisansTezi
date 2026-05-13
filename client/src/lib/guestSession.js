const GUEST_SESSION_KEY = "moodlens_guest_session_id";
const GUEST_REMAINING_KEY = "moodlens_guest_remaining";
const ANALYSIS_COOLDOWN_KEY = "moodlens_analysis_cooldown_until_v2";
const LEGACY_ANALYSIS_COOLDOWN_KEY = "moodlens_analysis_cooldown_until";
const DEFAULT_GUEST_LIMIT = 3;

function clearLegacyAnalysisCooldown() {
  localStorage.removeItem(LEGACY_ANALYSIS_COOLDOWN_KEY);
}

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

export function getAnalysisCooldownRemainingSeconds() {
  clearLegacyAnalysisCooldown();
  const storedValue = Number(localStorage.getItem(ANALYSIS_COOLDOWN_KEY) || 0);
  if (!Number.isFinite(storedValue) || storedValue <= Date.now()) {
    localStorage.removeItem(ANALYSIS_COOLDOWN_KEY);
    return 0;
  }

  return Math.max(0, Math.ceil((storedValue - Date.now()) / 1000));
}

export function setAnalysisCooldown(seconds) {
  clearLegacyAnalysisCooldown();
  const normalized = Math.max(0, Number(seconds) || 0);
  if (normalized <= 0) {
    localStorage.removeItem(ANALYSIS_COOLDOWN_KEY);
    return;
  }

  localStorage.setItem(
    ANALYSIS_COOLDOWN_KEY,
    String(Date.now() + normalized * 1000),
  );
}

export function clearAnalysisCooldown() {
  clearLegacyAnalysisCooldown();
  localStorage.removeItem(ANALYSIS_COOLDOWN_KEY);
}

export function resetGuestSessionState() {
  localStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem(GUEST_REMAINING_KEY);
  clearLegacyAnalysisCooldown();
  localStorage.removeItem(ANALYSIS_COOLDOWN_KEY);
}

export function getDefaultGuestLimit() {
  return DEFAULT_GUEST_LIMIT;
}
