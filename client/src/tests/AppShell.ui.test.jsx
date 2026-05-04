import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import App from "../App";
import { useAuthStore } from "../store/authStore";
import { renderWithProviders, resetAuthStore } from "./test-utils";

describe("App shell", () => {
  beforeEach(() => {
    resetAuthStore(useAuthStore);
    delete document.documentElement.dataset.theme;
  });

  it("renders the main shell with navbar, footer, and a default theme", () => {
    renderWithProviders(<App />);

    expect(screen.getByRole("navigation", { name: /birincil|primary/i })).toBeInTheDocument();
    expect(screen.getByText(/pamukkale|university/i)).toBeInTheDocument();
    expect(screen.queryByText(/common\./i)).not.toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
