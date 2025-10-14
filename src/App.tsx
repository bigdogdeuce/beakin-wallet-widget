// src/App.tsx
import React from "react";
import WalletProviders from "./components/WalletProviders";
import ConnectBar from "./components/ConnectBar";
import BeakinWidget from "./components/BeakinWidget";

export default function App() {
  return (
    <WalletProviders>
      <main>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <ConnectBar />
        </div>
        <BeakinWidget />
      </main>
    </WalletProviders>
  );
}
