import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";
import { renderWithProviders, resetAuthStore } from "./test-utils";

describe("Navbar", () => {
  beforeEach(() => {
    resetAuthStore(useAuthStore);
    delete document.documentElement.dataset.theme;
  });

  it("renders product identity, navigation, and the theme toggle", () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole("navigation", { name: /birincil|primary/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ana sayfa|home page/i)).toBeInTheDocument();
    expect(screen.getAllByText(/analiz|analyze/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/misafir|guest/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acik temaya gec|switch to light mode/i })).toBeInTheDocument();
  });

  it("shows login and register actions for guest users", () => {
    renderWithProviders(<Navbar />);

    expect(screen.getAllByRole("link", { name: /giriş|sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /kayıt ol|create account/i }).length).toBeGreaterThan(0);
  });

  it("updates the root theme attribute when the toggle is pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);

    const toggle = screen.getByRole("button", { name: /acik temaya gec|switch to light mode/i });
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: /koyu temaya gec|switch to dark mode/i })).toBeInTheDocument();
  });
});
