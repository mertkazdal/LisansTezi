import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalyzePage from "../pages/AnalyzePage";
import { ONBOARDING_STORAGE_KEY } from "../features/onboarding";
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
    sessionStorage.clear();
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
    expect(screen.queryByRole("checkbox", { name: /mahremiyet onayı/i })).not.toBeInTheDocument();
    expect(screen.getByText(/esnek bir akış seç/i)).toBeInTheDocument();
  });

  it("sadece metin varken CTA aktif olur ve selfie alanı görünür kalır", async () => {
    const user = userEvent.setup();
    storeCompletedSurvey();
    renderWithProviders(<AnalyzePage />);

    await user.click(screen.getAllByRole("button", { name: /analiz stüdyosunu aç/i })[0]);
    await user.type(screen.getByRole("textbox", { name: /duygu günlüğü metni/i }), "Bugün biraz yorgun ama umutlu hissediyorum.");

    const submitButton = screen.getByRole("button", { name: /analizi başlat/i });
    expect(submitButton).toBeEnabled();
    expect(screen.getAllByText(/selfie sinyali/i).length).toBeGreaterThan(0);
  });
});
