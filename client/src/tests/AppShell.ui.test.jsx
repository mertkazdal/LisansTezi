import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { COLOR_THEME_STORAGE_KEY } from "../components/system/ColorStyleProvider";
import { useAuthStore } from "../store/authStore";
import { renderWithProviders, resetAuthStore } from "./test-utils";

describe("App shell", () => {
  beforeEach(() => {
    resetAuthStore(useAuthStore);
    delete document.documentElement.dataset.colorTheme;
  });

  it("renders the main shell with navbar, footer, and the default color theme", async () => {
    renderWithProviders(<App />);

    expect(screen.getByRole("navigation", { name: /birincil|primary/i })).toBeInTheDocument();
    expect(screen.getByText(/pamukkale|university/i)).toBeInTheDocument();
    expect(screen.queryByText(/common\./i)).not.toBeInTheDocument();
    expect(document.documentElement.dataset.colorTheme).toBe("kirmizi");
    expect(await screen.findByRole("group", { name: /renk/i }, { timeout: 5000 })).toBeInTheDocument();
  });

  it("stores the selected color theme", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(await screen.findByRole("button", { name: /mavi tema/i }));

    expect(document.documentElement.dataset.colorTheme).toBe("mavi");
    expect(localStorage.getItem(COLOR_THEME_STORAGE_KEY)).toBe("mavi");
  });
});
