import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingSurvey, {
  ONBOARDING_STORAGE_KEY,
  getStoredRecommendationSurvey,
  hasStoredOnboardingDraft,
} from "../features/onboarding/OnboardingSurvey";
import { renderWithProviders } from "./test-utils";

describe("OnboardingSurvey", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("yarım bırakılan anketi taslak olarak saklar ve yeniden açınca devam seçeneği gösterir", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const firstRender = renderWithProviders(<OnboardingSurvey onClose={onClose} />, { router: false });

    await user.click(screen.getByRole("button", { name: /başlayalım/i }));
    await user.click(screen.getByRole("button", { name: /akustik/i }));
    await user.click(screen.getByRole("button", { name: /anketi kapat/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(sessionStorage.getItem(ONBOARDING_STORAGE_KEY));
    expect(stored).toEqual(expect.objectContaining({
      draft: expect.objectContaining({
        screen: 1,
        answers: expect.objectContaining({ music: ["Akustik"] }),
      }),
    }));
    expect(stored.userProfile).toBeUndefined();
    expect(stored.recommendationSurvey).toBeUndefined();
    expect(getStoredRecommendationSurvey()).toBeNull();

    firstRender.unmount();
    renderWithProviders(<OnboardingSurvey onClose={vi.fn()} />, { router: false });

    expect(screen.getByRole("button", { name: /kaldığın yerden devam et/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /baştan başlat/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /kaldığın yerden devam et/i }));

    expect(screen.getByRole("heading", { name: /müzikte hangi dünyalara yakınsın/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /akustik/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("tamamlanmış profil düzenleme modunda cevapları seçili açar", () => {
    renderWithProviders(
      <OnboardingSurvey
        restartFromProfile
        initialProfile={{
          music: ["Akustik"],
          movies: ["Dram (derin ve duygusal)"],
          books: ["Psikoloji"],
          peakTime: "Gün içi",
          socialEnergy: "Biraz içedönük",
          stressCoping: ["Yakın biriyle konuş"],
          philosophy: "Dengede kal",
        }}
      />,
      { router: false },
    );

    expect(screen.getByRole("heading", { name: /müzikte hangi dünyalara yakınsın/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /akustik/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("tum cevaplar verildikten sonra kapatilirsa taslak yerine tamamlanmis anket saklar", async () => {
    const user = userEvent.setup();
    const firstRender = renderWithProviders(<OnboardingSurvey onClose={vi.fn()} />, { router: false });

    await user.click(screen.getByRole("button", { name: /layal/i }));
    await user.click(screen.getByRole("button", { name: /akustik/i }));
    await user.click(screen.getByRole("button", { name: /leri/i }));
    await user.click(screen.getByRole("button", { name: /dram/i }));
    await user.click(screen.getByRole("button", { name: /leri/i }));
    await user.click(screen.getByRole("button", { name: /psikoloji/i }));
    await user.click(screen.getByRole("button", { name: /leri/i }));
    await user.click(screen.getByRole("button", { name: /sabah erken/i }));
    await user.click(screen.getByRole("button", { name: /leri/i }));
    await user.click(screen.getAllByRole("button", { name: /tam/i })[0]);
    await user.click(screen.getByRole("button", { name: /leri/i }));
    await user.click(screen.getByRole("button", { name: /uy ya da dinlen/i }));
    await user.click(screen.getByRole("button", { name: /leri/i }));
    await user.click(screen.getByRole("button", { name: /anlam ara/i }));
    await user.click(screen.getByRole("button", { name: /anketi kapat/i }));

    expect(getStoredRecommendationSurvey()).toEqual(expect.objectContaining({
      recommendationGoal: expect.any(String),
      energyPreference: expect.any(String),
    }));
    expect(hasStoredOnboardingDraft()).toBe(false);

    firstRender.unmount();
    renderWithProviders(<OnboardingSurvey onClose={vi.fn()} />, { router: false });

    expect(screen.queryByRole("button", { name: /kald/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tan/i })).not.toBeInTheDocument();
  });
});
