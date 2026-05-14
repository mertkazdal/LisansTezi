import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { COLOR_THEME_STORAGE_KEY } from "../components/system/ColorStyleProvider";
import HomePage from "../pages/HomePage";
import { api, userAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { renderWithProviders, resetAuthStore } from "./test-utils";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual("../services/api");
  return {
    ...actual,
    userAPI: {
      ...actual.userAPI,
      getProfile: vi.fn(),
    },
  };
});

describe("App shell", () => {
  beforeEach(() => {
    resetAuthStore(useAuthStore);
    delete document.documentElement.dataset.colorTheme;
    userAPI.getProfile.mockResolvedValue({
      id: "user-1",
      username: "erkam",
      email: "erkam@gmail.com",
      preferredColorTheme: "kirmizi",
    });
    vi.spyOn(api, "put").mockResolvedValue({ data: { preferredColorTheme: "mavi" } });
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

  it("saves selected home theme to the logged-in account", async () => {
    const user = userEvent.setup();
    useAuthStore.getState().login(
      { id: "user-1", username: "erkam", email: "erkam@gmail.com", preferredColorTheme: "kirmizi" },
      "test-token",
    );

    renderWithProviders(<HomePage />);

    expect(useAuthStore.getState().isLoggedIn).toBe(true);
    await user.click(await screen.findByRole("button", { name: /mavi tema/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/api/user/theme", { colorTheme: "mavi" });
    });
    expect(useAuthStore.getState().user.preferredColorTheme).toBe("mavi");
    expect(document.documentElement.dataset.colorTheme).toBe("mavi");
  });
});
