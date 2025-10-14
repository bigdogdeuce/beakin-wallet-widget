// src/lib/solana.ts
import type { Commitment } from "@solana/web3.js";

// Use your env var if set; otherwise fall back to mainnet
export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";

// Keep this aligned with your desired UX/latency tradeoff
export const COMMITMENT: Commitment = "confirmed";
