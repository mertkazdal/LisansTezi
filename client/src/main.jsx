import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./i18n.js";
import "./styles/global.css";
import { registerServiceWorker } from "./lib/registerServiceWorker";
import { ColorStyleProvider } from "./components/system/ColorStyleProvider";

function ThemedToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--theme-surface-alt)",
          color: "var(--theme-text)",
          border: "1px solid var(--theme-border)",
          borderRadius: "16px",
          boxShadow: "0 22px 50px var(--theme-shadow)",
          backdropFilter: "blur(18px)",
        },
        success: {
          iconTheme: { primary: "var(--theme-positive)", secondary: "var(--theme-primary-foreground)" },
        },
        error: {
          iconTheme: { primary: "var(--theme-danger)", secondary: "var(--theme-primary-foreground)" },
        },
      }}
    />
  );
}

function AppRoot() {
  return (
    <ColorStyleProvider>
      <BrowserRouter>
        <App />
        <ThemedToaster />
      </BrowserRouter>
    </ColorStyleProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);

registerServiceWorker();
