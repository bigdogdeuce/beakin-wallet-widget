// src/lib/wallets.ts
import { useMemo } from "react";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
// Optional: comment out if you don’t want Phantom
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

export function useWalletAdapters() {
  // Note: order here is the order shown in the WalletModal
  return useMemo(
    () => [
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),      // Direct Ledger via WebHID
      new PhantomWalletAdapter(),     // Optional
    ],
    []
  );
}
