import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "../i18n";
import { ThemeProvider } from "../components/system/ThemeProvider";

export function renderWithProviders(ui, { route = "/", router = true } = {}) {
  if (!router) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  }

  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ThemeProvider>,
  );
}

export function resetAuthStore(useAuthStore) {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isLoggedIn: false,
  });
  localStorage.clear();
}
