import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";

export const COLOR_THEME_STORAGE_KEY = "life-coach-color-theme";

export const COLOR_THEMES = [
  { id: "kirmizi", label: "Kırmızı", primary: "#E2231A" },
  { id: "mavi", label: "Mavi", primary: "#1A5CE2" },
  { id: "yesil", label: "Yeşil", primary: "#22A655" },
  { id: "sari", label: "Sarı", primary: "#E2A800" },
  { id: "siyah", label: "Siyah", primary: "#111111" },
  { id: "beyaz", label: "Beyaz", primary: "#F5F5F5" },
];

const DEFAULT_COLOR_THEME = "kirmizi";
const ColorStyleContext = createContext(null);
const VALID_THEME_IDS = new Set(COLOR_THEMES.map((theme) => theme.id));

function resolveInitialColorTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_COLOR_THEME;
  }

  const storedTheme = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  return VALID_THEME_IDS.has(storedTheme) ? storedTheme : DEFAULT_COLOR_THEME;
}

export function ColorStyleProvider({ children }) {
  const [colorTheme, setColorTheme] = useState(resolveInitialColorTheme);
  const accountTheme = useAuthStore((state) => state.user?.preferredColorTheme);

  useEffect(() => {
    if (VALID_THEME_IDS.has(accountTheme) && accountTheme !== colorTheme) {
      setColorTheme(accountTheme);
    }
  }, [accountTheme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.dataset.colorTheme = colorTheme;
    root.classList.remove("dark", "light");

    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  const value = useMemo(
    () => ({
      colorTheme,
      setColorTheme,
      themes: COLOR_THEMES,
    }),
    [colorTheme],
  );

  return <ColorStyleContext.Provider value={value}>{children}</ColorStyleContext.Provider>;
}

export function useColorStyle() {
  const context = useContext(ColorStyleContext);

  if (!context) {
    throw new Error("useColorStyle must be used within ColorStyleProvider.");
  }

  return context;
}
