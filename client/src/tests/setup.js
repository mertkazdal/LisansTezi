import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = "";
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

global.ResizeObserver = ResizeObserverMock;
global.IntersectionObserver = IntersectionObserverMock;

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  measureText: vi.fn((text) => ({ width: String(text).length * 12 })),
  fillText: vi.fn(),
}));

HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(["test"], { type: "image/png" }));
});

URL.createObjectURL = vi.fn(() => "blob:test");
URL.revokeObjectURL = vi.fn();

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        React.forwardRef(
          (
            {
              children,
              initial,
              animate,
              exit,
              transition,
              whileHover,
              whileTap,
              whileInView,
              viewport,
              variants,
              layout,
              layoutId,
              ...props
            },
            ref,
          ) => React.createElement(tag, { ref, ...props }, children),
        ),
    },
  );

  return {
    motion,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  };
});

vi.mock("react-hot-toast", () => {
  const toast = vi.fn();
  toast.success = vi.fn();
  toast.error = vi.fn();
  return { default: toast };
});

vi.mock("react-webcam", () => ({
  default: () => React.createElement("video", { "data-testid": "webcam" }),
}));
