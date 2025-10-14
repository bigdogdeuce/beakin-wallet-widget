// src/components/ConnectBar.tsx
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/**
 * NOTE:
 * - No hooks are used at module scope.
 * - All wallet hooks are called inside the component body (after providers mount).
 * - We avoid useWalletModal() entirely to prevent context access before provider.
 */
export default function ConnectBar() {
  const { publicKey } = useWallet();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <WalletMultiButton />
      {publicKey && (
        <code style={{ fontSize: 12, opacity: 0.65 }}>
          {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
        </code>
      )}
    </div>
  );
}
