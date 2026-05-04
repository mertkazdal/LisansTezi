import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { renderWithProviders } from "./test-utils";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual("../services/api");
  return {
    ...actual,
    authAPI: {
      login: vi.fn(),
      register: vi.fn(),
    },
  };
});

describe("Auth pages", () => {
  it("login formu zorunlu alan uyarısını gösterir", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /giriş yap/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/e-posta ve şifre/i);
  });

  it("register formu şifre eşleşmeme validation mesajını gösterir", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    fireEvent.change(screen.getByLabelText(/kullanıcı adı/i), { target: { value: "eray" } });
    fireEvent.change(screen.getByLabelText(/e-posta/i), { target: { value: "eray@example.com" } });
    fireEvent.change(screen.getByLabelText(/^şifre$/i), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText(/şifre tekrar/i), { target: { value: "654321" } });
    await user.click(screen.getByRole("button", { name: /kayıt ol/i }));

    expect(screen.getByText(/şifreler eşleşmiyor/i)).toBeInTheDocument();
  });
});
