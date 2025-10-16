// Polyfills for browser (needed by web3/wallet libs)
import { Buffer } from "buffer";
import process from "process";
(window as any).Buffer ??= Buffer;
(window as any).process ??= { env: process.env ?? {} };

// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WalletProviders from "./components/WalletProviders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProviders>
      <App />
    </WalletProviders>
  </React.StrictMode>
);
