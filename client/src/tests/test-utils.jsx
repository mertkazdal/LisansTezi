import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "../i18n";
import { ColorStyleProvider } from "../components/system/ColorStyleProvider";

export function renderWithProviders(ui, { route = "/", router = true } = {}) {
  if (!router) {
    return render(<ColorStyleProvider>{ui}</ColorStyleProvider>);
  }

  return render(
    <ColorStyleProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ColorStyleProvider>,
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
