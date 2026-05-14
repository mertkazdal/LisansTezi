import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalyzePage from "../pages/AnalyzePage";
import { ONBOARDING_STORAGE_KEY } from "../features/onboarding";
import { emotionAPI, guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { renderWithProviders } from "./test-utils";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual("../services/api");
  return {
    ...actual,
    emotionAPI: {
      analyze: vi.fn(),
    },
  };
});

describe("AnalyzePage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    guestSessionAPI.resetGuestSessionState();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoggedIn: false,
    });
  });

  function storeCompletedSurvey() {
    sessionStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        userProfile: { completedAt: "2026-05-13T00:00:00.000Z" },
        recommendationSurvey: {
          recommendationGoal: "comfort",
          energyPreference: "balanced",
          musicGenres: ["acoustic"],
          movieGenres: ["drama"],
          bookGenres: ["psychology"],
        },
      }),
    );
  }

  it("misafir anketi eksikse analiz ekranına girişte doğrudan açılır", () => {
    renderWithProviders(<AnalyzePage />);

    expect(screen.getByRole("dialog", { name: /kişisel yaşam koçu onboarding anketi/i })).toBeInTheDocument();
  });

  it("analiz stüdyosu formunu kullanıcı açınca gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    expect(screen.getAllByText(/analiz stüdyosu/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox", { name: /duygu günlüğü metni/i })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);

    expect(screen.getByRole("dialog", { name: /girdini burada ekle/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /duygu günlüğü metni/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /yaş aralığı/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "18-24" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /mahremiyet onayı/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/zorunlu/i).length).toBeGreaterThan(0);
  });

  it("sadece metin varken CTA aktif olur ve selfie alanı görünür kalır", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.click(screen.getByRole("button", { name: "18-24" }));
    await user.type(screen.getByRole("textbox", { name: /duygu günlüğü metni/i }), "Bugün biraz yorgun ama umutlu hissediyorum.");

    const submitButton = screen.getByRole("button", { name: /analizi başlat/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getAllByText(/selfie sinyali/i).length).toBeGreaterThan(0);
  });

  it("eksik girdiyle CTA tıklanınca modal içinde uyarı gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);

    const submitButton = screen.getByRole("button", { name: /analizi başlat/i });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByText(/girdi gerekli/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/metin, selfie ya da ikisinden birini/i).length).toBeGreaterThan(0);
  });

  it("yaş aralığı seçilmezse yaş uyarısını gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.type(screen.getByRole("textbox", { name: /duygu günlüğü metni/i }), "Bugün kendimi daha sakin ve toparlanmış hissediyorum.");
    await user.click(screen.getByRole("button", { name: /analizi başlat/i }));

    expect(screen.getAllByText(/yaş aralığı gerekli/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/dört yaş aralığından birini seç/i).length).toBeGreaterThan(0);
  });

  it("selfie seçilip onay verilmezse mahremiyet uyarısı gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.click(screen.getByRole("button", { name: "18-24" }));

    const fileInput = document.querySelector("input[type='file']");
    await user.upload(fileInput, new File(["fake-image"], "selfie.png", { type: "image/png" }));
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /mahremiyet onayı/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /analizi başlat/i });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/mahremiyet onayı gerekli/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/mahremiyet onayını işaretle/i).length).toBeGreaterThan(0);
  });

  it("desteklenmeyen dosya formatında fotoğraf uyarısı gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);

    const fileInput = document.querySelector("input[type='file']");
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["not-image"], "selfie.txt", { type: "text/plain" })],
      },
    });

    expect(screen.getAllByText(/fotoğraf kontrol edilmeli/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/bu dosya formatı desteklenmiyor/i).length).toBeGreaterThan(0);
  });

  it("çok büyük fotoğrafta boyut uyarısı gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);

    const largeImage = new File(["fake-image"], "large-selfie.png", { type: "image/png" });
    Object.defineProperty(largeImage, "size", { value: 10 * 1024 * 1024 + 1 });

    const fileInput = document.querySelector("input[type='file']");
    fireEvent.change(fileInput, {
      target: {
        files: [largeImage],
      },
    });

    expect(screen.getAllByText(/fotoğraf kontrol edilmeli/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/fotoğraf boyutu çok büyük/i).length).toBeGreaterThan(0);
  });

  it("misafir kotası dolunca kota uyarısı gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    guestSessionAPI.setGuestRemainingAnalyses(0);
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.click(screen.getByRole("button", { name: /giriş yap/i }));

    expect(screen.getAllByText(/misafir hakkı doldu/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3 analiz hakkını kullandın/i).length).toBeGreaterThan(0);
  });

  it("çelişki cooldown aktifken bekleme uyarısı gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    guestSessionAPI.setAnalysisCooldown(60);
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.click(screen.getByRole("button", { name: /bekle/i }));

    expect(screen.getAllByText(/1 dakikalık bekleme aktif/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tutarsız sinyaller/i).length).toBeGreaterThan(0);
  });

  it("servisten gelen çelişki uyarısını modal içinde gösterir", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    emotionAPI.analyze.mockRejectedValueOnce(
      Object.assign(new Error("Selfie ve metin birbirine zıt görünüyor."), {
        code: "ANALYSIS_CONTRADICTION_WARNING",
        details: {
          alertTitle: "Zit duygu tespiti",
          alertHint: "Tekrar denersen sistemi farklı bir analiz anahtarıyla yeniden kontrol edeceğiz.",
        },
      }),
    );
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.click(screen.getByRole("button", { name: "18-24" }));
    await user.type(screen.getByRole("textbox", { name: /duygu günlüğü metni/i }), "Bugün çok iyi ama içimde ters bir ağırlık da var.");
    await user.click(screen.getByRole("button", { name: /analizi başlat/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/zit duygu tespiti/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/selfie ve metin birbirine zıt/i).length).toBeGreaterThan(0);
  });
});
