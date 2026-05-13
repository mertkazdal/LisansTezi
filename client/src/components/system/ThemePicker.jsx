import { useColorStyle } from "./ColorStyleProvider";

export default function ThemePicker() {
  const { colorTheme, setColorTheme, themes } = useColorStyle();

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
          onClick={() => setColorTheme(theme.id)}
          style={{ background: theme.primary }}
        />
      ))}
    </div>
  );
}
