import { useState } from "react";
import { userAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useColorStyle } from "./ColorStyleProvider";

export default function ThemePicker() {
  const { colorTheme, setColorTheme, themes } = useColorStyle();
  const [savingTheme, setSavingTheme] = useState("");

  async function handleThemeSelect(nextTheme) {
    if (!nextTheme || nextTheme === colorTheme || savingTheme) {
      return;
    }

    const { isLoggedIn, updateUser } = useAuthStore.getState();
    const previousTheme = colorTheme;
    setColorTheme(nextTheme);

    if (!isLoggedIn) {
      return;
    }

    updateUser({ preferredColorTheme: nextTheme });
    setSavingTheme(nextTheme);
    try {
      const result = await userAPI.updateColorTheme(nextTheme);
      updateUser({ preferredColorTheme: result.preferredColorTheme || nextTheme });
    } catch {
      setColorTheme(previousTheme);
      updateUser({ preferredColorTheme: previousTheme });
    } finally {
      setSavingTheme("");
    }
  }

  return (
    <div className="theme-picker" role="group" aria-label="Renk teması seç">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className="theme-picker__button"
          data-color-theme-option={theme.id}
          aria-label={`${theme.label} tema`}
          aria-pressed={colorTheme === theme.id}
          disabled={Boolean(savingTheme)}
          onClick={() => {
            void handleThemeSelect(theme.id);
          }}
          style={{ background: theme.primary }}
        />
      ))}
    </div>
  );
}
