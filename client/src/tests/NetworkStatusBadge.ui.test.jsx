import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import NetworkStatusBadge from "../components/system/NetworkStatusBadge";
import { renderWithProviders } from "./test-utils";

function setOnlineStatus(value) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("NetworkStatusBadge", () => {
  it("online başlangıçta badge göstermez", () => {
    setOnlineStatus(true);
    renderWithProviders(<NetworkStatusBadge />, { router: false });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("offline event sonrası çevrimdışı demo durumunu gösterir", () => {
    setOnlineStatus(true);
    renderWithProviders(<NetworkStatusBadge />, { router: false });

    setOnlineStatus(false);
    fireEvent(window, new Event("offline"));

    expect(screen.getByRole("status")).toHaveTextContent(/çevrimdışı demo modu/i);
  });

  it("online event sonrası bağlantı geri geldi mesajını gösterir", () => {
    setOnlineStatus(false);
    renderWithProviders(<NetworkStatusBadge />, { router: false });

    setOnlineStatus(true);
    fireEvent(window, new Event("online"));

    expect(screen.getByRole("status")).toHaveTextContent(/bağlantı geri geldi/i);
  });
});
