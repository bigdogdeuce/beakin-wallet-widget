// src/components/WalletProviders.tsx
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

import { RPC_ENDPOINT } from "@/lib/solana"; // adjust path if needed

// Optional: expose adapters as a named helper (NOT default)
export function useWalletAdapters() {
  return useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(), // uses WebHID in Chrome
    ],
    []
  );
}

export default function WalletProviders({ children }: { children: React.ReactNode }) {
  const wallets = useWalletAdapters();

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
