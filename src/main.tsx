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
