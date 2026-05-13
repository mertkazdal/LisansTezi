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

  it("closes the guest navbar on pointer leave, outside click, Escape, and nav actions", () => {
    renderWithProviders(<Navbar />);

    const navbar = screen.getByRole("navigation", { name: /birincil|primary/i });

    fireEvent.pointerEnter(navbar);
    expect(navbar).toHaveClass("is-open");

    fireEvent.pointerLeave(navbar);
    expect(navbar).not.toHaveClass("is-open");

    fireEvent.pointerEnter(navbar);
    fireEvent.pointerDown(document.body);
    expect(navbar).not.toHaveClass("is-open");

    fireEvent.pointerEnter(navbar);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(navbar).not.toHaveClass("is-open");

    fireEvent.pointerEnter(navbar);
    fireEvent.click(screen.getByLabelText(/ana sayfa|home page/i));
    expect(navbar).not.toHaveClass("is-open");
  });
});
