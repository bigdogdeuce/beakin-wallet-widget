// src/lib/tokens.ts
// Minimal token registry for the Beakin Wallet widget.
// Add/adjust entries here; UI + swap math import from this single source.

export type TokenMeta = {
  symbol: string;
  name: string;
  mint: string;      // SPL mint address
  decimals: number;  // on-chain decimals
  icon?: string;     // optional relative path in /public (or full URL)
  priority?: number; // lower = show earlier in lists
};

export const TOKENS: Record<string, TokenMeta> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112", // WSOL mint
    decimals: 9,
    icon: "/icons/sol.png",
    priority: 0,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    icon: "/icons/usdc.png",
    priority: 1,
  },
  
// src/lib/tokens.ts (BKIN entry only)
  BKIN: {
    symbol: "BKIN",
    name: "Beakin",
    mint: "5NRY1VRqd19W7GSjdFThSREz1WvEShAk3pgN3KdN8a82", // ✅ BKIN mint
    decimals: 9,                                      // adjust if BKIN uses a different decimal count
    icon: "/icons/icon128.png",
    priority: 2,
  },

  SHRIK: {
    symbol: "SHRIK",
    name: "Shrik Coin",
    // From your notes (mint provided previously)
    mint: "8z5L6vPkCoJixGUdrRsjxRpFhg228akz8U4EgTeBmoon",
    // Adjust if SHRIK uses a different decimal count
    decimals: 9,
    // You also have a 512px coin logo name in your notes; use if preferred:
    // icon: "/icons/coin_logo_512.png",
    icon: "/icons/icon128.png",
    priority: 3,
  },
};

// Handy accessors
export const byMint = (mint: string) =>
  Object.values(TOKENS).find((t) => t.mint === mint);

export const bySymbol = (symbol: string) =>
  TOKENS[symbol.toUpperCase()];

export const orderedTokens = () =>
  Object.values(TOKENS).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
