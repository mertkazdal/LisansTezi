import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import Navbar from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";
import { renderWithProviders, resetAuthStore } from "./test-utils";

describe("Navbar", () => {
  beforeEach(() => {
    resetAuthStore(useAuthStore);
    delete document.documentElement.dataset.colorTheme;
  });

  it("renders product identity and navigation without a dark/light toggle", () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole("navigation", { name: /birincil|primary/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ana sayfa|home page/i)).toBeInTheDocument();
    expect(screen.getAllByText(/analiz|analyze/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/misafir|guest/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /acik temaya gec|switch to light mode|koyu temaya gec|switch to dark mode/i })).not.toBeInTheDocument();
  });

  it("shows login and register actions for guest users", () => {
    renderWithProviders(<Navbar />);

    expect(screen.getAllByRole("link", { name: /giriş|sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /kayıt ol|create account/i }).length).toBeGreaterThan(0);
  });

  it("toggles the mobile navbar with an icon-only hamburger and closes on outside actions", () => {
    renderWithProviders(<Navbar />);

    const navbar = screen.getByRole("navigation", { name: /birincil|primary/i });
    const openButton = screen.getByRole("button", { name: /menüyü aç|open menu/i });

    expect(openButton).toHaveTextContent("☰");
    expect(openButton).not.toHaveTextContent(/menü|menu/i);

    fireEvent.click(openButton);
    expect(navbar).not.toHaveClass("is-open");
    expect(screen.getByRole("button", { name: /menüyü kapat|close menu/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /menüyü kapat|close menu/i })).toHaveTextContent("✕");

    fireEvent.click(screen.getByRole("button", { name: /menüyü kapat|close menu/i }));
    expect(navbar).not.toHaveClass("is-open");

    fireEvent.click(openButton);
    fireEvent.pointerDown(document.body);
    expect(navbar).not.toHaveClass("is-open");

    fireEvent.click(openButton);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(navbar).not.toHaveClass("is-open");

    fireEvent.click(openButton);
    fireEvent.click(screen.getByLabelText(/ana sayfa|home page/i));
    expect(navbar).not.toHaveClass("is-open");
  });
});
