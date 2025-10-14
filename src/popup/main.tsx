// src/popup/main.tsx
// Polyfill Buffer for browser build
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";
import WalletProviders from "../components/WalletProviders";  // ✅ add this

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProviders>
      <App />
    </WalletProviders>
  </React.StrictMode>
);
