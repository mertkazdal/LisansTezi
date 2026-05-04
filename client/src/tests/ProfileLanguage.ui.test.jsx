import { describe, expect, it, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../i18n";
import { LanguagePanel } from "../pages/ProfilePage";
import { renderWithProviders } from "./test-utils";

describe("LanguagePanel", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("tr");
    localStorage.setItem("language", "tr");
  });

  it("dil butonlarını erişilebilir seçili durumla gösterir", () => {
    renderWithProviders(<LanguagePanel i18n={i18n} t={i18n.t.bind(i18n)} />, { router: false });

    expect(screen.getByRole("button", { name: /türkçe/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /english/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("English seçilince language localStorage değerini günceller", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<LanguagePanel i18n={i18n} t={i18n.t.bind(i18n)} />, { router: false });

    await user.click(screen.getByRole("button", { name: /english/i }));
    rerender(<LanguagePanel i18n={i18n} t={i18n.t.bind(i18n)} />);

    expect(localStorage.getItem("language")).toBe("en");
    expect(screen.getByRole("button", { name: /english/i })).toHaveAttribute("aria-pressed", "true");
  });
});
