import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { ONBOARDING_STORAGE_KEY } from "../features/onboarding";
import { authAPI } from "../services/api";
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

const completedSurvey = {
  recommendationGoal: "comfort",
  energyPreference: "balanced",
  musicGenres: ["acoustic"],
  movieGenres: ["drama"],
  bookGenres: ["psychology"],
};

describe("Auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  function storeCompletedSurvey() {
    sessionStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        userProfile: { completedAt: "2026-05-12T00:00:00.000Z" },
        recommendationSurvey: completedSurvey,
      }),
    );
  }

  function fillRegisterFields({ passwordConfirm = "Guclu123" } = {}) {
    fireEvent.change(screen.getByLabelText(/kullan|username/i), { target: { value: "mertdemo" } });
    fireEvent.change(screen.getByLabelText(/e-posta|email/i), { target: { value: "mert@example.com" } });
    fireEvent.change(screen.getByLabelText(/^sifre$|^password$|^şifre$/i), { target: { value: "Guclu123" } });
    fireEvent.change(screen.getByLabelText(/tekrar|confirm password/i), { target: { value: passwordConfirm } });
  }

  it("login formu zorunlu alan uyarısını gösterir", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByLabelText(/e-posta|email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sifre|password|şifre/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /giris yap|sign in|giriş yap/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/e-posta|email/i);
  });

  it("register formu şifre eşleşmeme validation mesajı gösterir", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    fillRegisterFields({ passwordConfirm: "654321" });
    await user.click(screen.getByRole("button", { name: /kayit ol|create account|kayıt ol/i }));

    expect(screen.getByText(/eslesmiyor|esles|match|eşleş/i)).toBeInTheDocument();
  });

  it("register formu tamamlanan misafir anketini kullanarak kayıt dener", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    authAPI.register.mockRejectedValueOnce({
      code: "EMAIL_IN_USE",
      message: "Bu e-posta zaten kayıtlı.",
    });

    renderWithProviders(<RegisterPage />, { route: "/register" });

    const editSurveyButton = screen.getByRole("button", { name: /anketi düzenle/i });
    expect(editSurveyButton).toBeEnabled();
    fillRegisterFields();
    await user.click(screen.getByRole("button", { name: /kayit ol|create account|kayıt ol/i }));

    expect(authAPI.register).toHaveBeenCalledWith(expect.objectContaining({
      recommendationSurvey: completedSurvey,
    }));
    expect(await screen.findByText(/hesap zaten var|account already exists/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /giris yap|sign in|giriş yap/i }).length).toBeGreaterThan(0);
  });

  it("register ekranı misafir anketini düzenlemeye açar", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();

    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.click(screen.getByRole("button", { name: /anketi düzenle/i }));

    expect(screen.getByRole("dialog", { name: /kişisel yaşam koçu onboarding anketi/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /müzikte hangi dünyalara yakınsın/i })).toBeInTheDocument();
  });

  it("register formu anket tamamlanmadan gonderilmez", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    fillRegisterFields();
    await user.click(screen.getByRole("button", { name: /kayit ol|create account|kayıt ol/i }));

    expect(screen.getByText(/anketi doldurmadan|survey/i)).toBeInTheDocument();
    expect(authAPI.register).not.toHaveBeenCalled();
  });
});
