import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../store/authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoggedIn: false,
    });
    localStorage.clear();
  });

  it("başlangıçta giriş yapılmamış durumdadır", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("login sonrası kullanıcı ve token bilgisini saklar", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login({ id: "1", username: "testuser", email: "test@test.com" }, "test-token-abc");
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user.username).toBe("testuser");
    expect(localStorage.getItem("access_token")).toBe("test-token-abc");
  });

  it("logout sonrası oturumu ve localStorage token bilgisini temizler", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login({ id: "1", username: "test", email: "t@t.com" }, "token");
      result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
