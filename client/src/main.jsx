import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./i18n.js";
import "./styles/global.css";
import { registerServiceWorker } from "./lib/registerServiceWorker";
import { ThemeProvider, useTheme } from "./components/system/ThemeProvider";

function ThemedToaster() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "rgba(8, 17, 31, 0.96)" : "rgba(255, 255, 255, 0.96)",
          color: isDark ? "#eef6ff" : "#122033",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.1)"}`,
          borderRadius: "16px",
          boxShadow: isDark
            ? "0 22px 50px rgba(2, 6, 23, 0.35)"
            : "0 22px 50px rgba(15, 23, 42, 0.12)",
          backdropFilter: "blur(18px)",
        },
        success: {
          iconTheme: { primary: "#0f766e", secondary: isDark ? "#eef6ff" : "#ffffff" },
        },
        error: {
          iconTheme: { primary: "#dc2626", secondary: isDark ? "#eef6ff" : "#ffffff" },
        },
      }}
    />
  );
}

function AppRoot() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <ThemedToaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);

registerServiceWorker();
