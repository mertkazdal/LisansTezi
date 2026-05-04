import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalyzePage from "../pages/AnalyzePage";
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
  it("analiz stüdyosu temel alanlarını gösterir", () => {
    renderWithProviders(<AnalyzePage />);

    expect(screen.getByText(/analiz stüdyosu/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /duygu günlüğü metni/i })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /mahremiyet onayı/i })).not.toBeInTheDocument();
    expect(screen.getByText(/esnek bir akış seç/i)).toBeInTheDocument();
  });

  it("sadece metin varken CTA aktif olur ve selfie alanı görünür kalır", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyzePage />);

    await user.type(screen.getByRole("textbox", { name: /duygu günlüğü metni/i }), "Bugün biraz yorgun ama umutlu hissediyorum.");

    const submitButton = screen.getByRole("button", { name: /analizi başlat/i });
    expect(submitButton).toBeEnabled();
    expect(screen.getAllByText(/selfie sinyali/i).length).toBeGreaterThan(0);
  });
});
