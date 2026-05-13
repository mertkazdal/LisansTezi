import { create } from "zustand";
import { ACCESS_TOKEN_KEY, USER_KEY, clearStoredSession } from "../services/api";
import { resetGuestQuotaState } from "../lib/guestSession";

function readUser() {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function readToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export const useAuthStore = create((set) => ({
  user: readUser(),
  accessToken: readToken(),
  isLoggedIn: Boolean(readToken()),

  login: (user, accessToken) => {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, isLoggedIn: true });
  },

  updateUser: (updates) => {
    set((state) => {
      if (!state.user) {
        return state;
      }

      const nextUser = { ...state.user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return { user: nextUser };
    });
  },

  logout: () => {
    clearStoredSession();
    resetGuestQuotaState();
    set({ user: null, accessToken: null, isLoggedIn: false });
  },

  hydrateToken: () => {
    const accessToken = readToken();
    const user = readUser();
    set({ user, accessToken, isLoggedIn: Boolean(accessToken) });
  },
}));
