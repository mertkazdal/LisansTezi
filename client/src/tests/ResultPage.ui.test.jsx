import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ResultPage from "../pages/ResultPage";
import "../i18n";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual("../services/api");
  return {
    ...actual,
    emotionAPI: {
      getRecommendations: vi.fn(),
    },
    feedbackAPI: {
      submit: vi.fn(),
    },
  };
});

vi.mock("../lib/resultShareCard", () => ({
  downloadResultSummaryCard: vi.fn(),
}));

describe("ResultPage", () => {
  it("renders the result experience from location state", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result/history-1",
            state: {
              analysisResult: {
                historyId: "history-1",
                emotion: "happy",
                confidence: 0.82,
                explanation: "Bugün pozitif bir enerji öne çıkıyor.",
                modalityUsed: "multimodal",
                modelUsed: "llm-image + gemini-text",
                faceDetected: true,
                recommendations: {
                  music: [{ title: "Güne Başla", artist: "Demo Artist", reason: "Enerjini korumak için." }],
                  movie: [],
                  book: [],
                  advice: [{ title: "Kısa yürüyüş", description: "Ritmini korumaya yardım eder." }],
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/result/:historyId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/tespit edilen duygu: mutlu/i)).toBeInTheDocument();
    expect(screen.queryByText(/güven skoru/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/senin için seçilen öneriler/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /kaydet/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/özet kartı indir/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pdf/i })).toBeInTheDocument();
  });

  it("shows the warning before the explanation when signals conflict", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result/history-2",
            state: {
              analysisResult: {
                historyId: "history-2",
                emotion: "sad",
                confidence: 0.77,
                explanation: "Metin ve selfie bir arada degerlendirildi.",
                warning: "Selfie ve yazdigin metin farkli duygular gosteriyor.",
                modalityUsed: "multimodal",
                modelUsed: "local-face-model + gemini-text",
                faceDetected: true,
                recommendations: {
                  music: [],
                  movie: [],
                  book: [],
                  advice: [],
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/result/:historyId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const warningText = await screen.findByText(/selfie ve yazdigin metin farkli duygular gosteriyor/i);
    const explanationText = screen.getByText(/metin ve selfie bir arada degerlendirildi/i);

    expect(screen.getByText(/dikkat edilmesi gereken not/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      warningText.compareDocumentPosition(explanationText) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows a fallback warning when contradiction flag arrives without warning text", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result/history-contradiction",
            state: {
              analysisResult: {
                historyId: "history-contradiction",
                emotion: "sad",
                confidence: 0.77,
                explanation: "Sonuc yeniden kontrol edildi.",
                contradictionDetected: true,
                modalityUsed: "multimodal",
                modelUsed: "local-face-model + gemini-text",
                faceDetected: true,
                recommendations: {
                  music: [],
                  movie: [],
                  book: [],
                  advice: [],
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/result/:historyId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText((text) => text.includes("Selfie ve metin") && text.includes("hazırlanmadan"))).toBeInTheDocument();
    expect(screen.getByText(/dikkat edilmesi gereken not/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows the fallback warning for snake_case conflict signals too", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result/history-conflict",
            state: {
              analysisResult: {
                historyId: "history-conflict",
                emotion: "sad",
                confidence: 0.77,
                explanation: "Sonuc yeniden kontrol edildi.",
                conflict_detected: true,
                modalityUsed: "multimodal",
                modelUsed: "local-face-model + gemini-text",
                faceDetected: true,
                recommendations: {
                  music: [],
                  movie: [],
                  book: [],
                  advice: [],
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/result/:historyId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/selfie ve metin farklı duygulara işaret etti/i);
  });

  it("auto-selects the first tab that actually has recommendations", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result/history-3",
            state: {
              analysisResult: {
                historyId: "history-3",
                emotion: "calm",
                confidence: 0.71,
                explanation: "Sessiz ama dengeli bir ton algilandi.",
                modalityUsed: "text",
                modelUsed: "gemini-text",
                faceDetected: false,
                recommendations: {
                  music: [],
                  movie: [],
                  book: [],
                  advice: [{ title: "Nefes molasi", description: "Bir dakikalik yavas nefes akisini dene." }],
                },
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/result/:historyId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/nefes molasi/i)).toBeInTheDocument();
  });
});
