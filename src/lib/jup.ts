// src/lib/jup.ts
// Client helpers for calling your Vercel proxy (price + quote + swap)

import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { RPC_ENDPOINT } from "./solana";

/** Base URL to your Vercel proxy */
export const PROXY_BASE =
  "https://beakin-jup-proxy-a6o7npht9-david-smiths-projects-2151599b.vercel.app";

/** Common mints */
export const SOL_MINT = "So11111111111111111111111111111111111111112"; // WSOL
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function ensureOk(r: Response) {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r;
}

/* ----------------------------- PRICE SNAPSHOT ----------------------------- */

/** Fetch price snapshot for one or more ids (tickers or mints). */
export async function getPrices(ids: string[]) {
  const url = `${PROXY_BASE}/api/jup/price?ids=${encodeURIComponent(ids.join(","))}`;
  const r = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  ensureOk(r);
  return r.json();
}

/* --------------------------------- QUOTES -------------------------------- */

export type QuoteOpts = {
  inputMint?: string; // default: SOL
  outputMint: string; // e.g., USDC_MINT
  amount: number; // base units (lamports for SOL, raw decimals for SPL)
  slippageBps?: number; // default 50 (0.5%)
  restrictIntermediateTokens?: boolean; // default true
  /** Optional: include a user public key Jupiter can use for routing/fees */
  userPublicKey?: string | PublicKey;
  /** Allow custom/unlisted tokens (required for SHRIK) */
  useUserProvidedTokens?: boolean; // default true for our app
};

/** Fetch a swap quote via your proxy (Jupiter Quote API). */
export async function getQuote(opts: QuoteOpts) {
  const {
    inputMint = SOL_MINT,
    outputMint,
    amount,
    slippageBps = 50,
    restrictIntermediateTokens = true,
    userPublicKey,
    useUserProvidedTokens = true, // turn on by default so SHRIK works
  } = opts;

  const sp = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
  });
  if (restrictIntermediateTokens) sp.set("restrictIntermediateTokens", "true");
  if (useUserProvidedTokens) sp.set("useUserProvidedTokens", "true");
  if (userPublicKey) {
    const v =
      typeof userPublicKey === "string" ? userPublicKey : userPublicKey.toBase58();
    sp.set("userPublicKey", v);
  }

  const url = `${PROXY_BASE}/api/jup/quote?${sp.toString()}`;
  const r = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  ensureOk(r);
  return r.json(); // <- quoteResponse used below in buildSwapTx
}

/* --------------------------------- SWAP ---------------------------------- */

export type BuildSwapOpts = {
  quoteResponse: any; // the object returned by getQuote()
  userPublicKey: PublicKey;
  // optional Jupiter params:
  wrapAndUnwrapSol?: boolean; // default true
  dynamicComputeUnitLimit?: boolean; // default true
  prioritizationFeeLamports?: "auto" | number; // default "auto"
};

/**
 * Ask proxy → Jupiter to build a base64-serialized VersionedTransaction.
 * You send back the 'quoteResponse' + user's public key; get a transaction to sign.
 */
export async function buildSwapTx({
  quoteResponse,
  userPublicKey,
  wrapAndUnwrapSol = true,
  dynamicComputeUnitLimit = true,
  prioritizationFeeLamports = "auto",
}: BuildSwapOpts): Promise<VersionedTransaction> {
  const r = await fetch(`${PROXY_BASE}/api/jup/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: userPublicKey.toBase58(),
      wrapAndUnwrapSol,
      dynamicComputeUnitLimit,
      prioritizationFeeLamports,
    }),
  });
  ensureOk(r);

  const { swapTransaction } = await r.json(); // base64 string
  // Buffer is provided by the global polyfill injected in index.html
  const buf = Buffer.from(swapTransaction, "base64");
  return VersionedTransaction.deserialize(buf);
}

/**
 * Sign & send the Jupiter transaction through the connected wallet.
 * - Works with Solflare and Ledger via wallet-adapter.
 * - Waits for "confirmed" and throws if the transaction fails.
 */
export async function signAndSendSwap(args: {
  tx: VersionedTransaction;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
}): Promise<string> {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  // 1) Sign with the current wallet (Solflare / Ledger)
  const signed = await args.signTransaction(args.tx);

  // 2) Send to the cluster
  const sig = await connection.sendTransaction(signed, {
    skipPreflight: false,
    maxRetries: 3,
  });

  // 3) Confirm
  const res = await connection.confirmTransaction(sig, "confirmed");
  if (res.value.err) {
    throw new Error(`Swap failed: ${JSON.stringify(res.value.err)}`);
  }
  return sig;
}

/* -------------------------- High-level convenience ------------------------ */
/**
 * One-call helper:
 *  - fetch quote
 *  - build swap tx
 *  - sign & send
 * Returns the transaction signature.
 */
export async function executeSwapViaJupiter(args: {
  inputMint: string;
  outputMint: string;
  amount: number; // base units
  slippageBps?: number;
  wallet: {
    publicKey: PublicKey | null;
    signTransaction?: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  };
}): Promise<string> {
  const { wallet, inputMint, outputMint, amount, slippageBps } = args;
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  // 1) Quote
  const quote = await getQuote({
    inputMint,
    outputMint,
    amount,
    slippageBps,
    userPublicKey: wallet.publicKey,
    useUserProvidedTokens: true, // ensure custom tokens like SHRIK work
  });

  // 2) Build swap transaction
  const tx = await buildSwapTx({
    quoteResponse: quote,
    userPublicKey: wallet.publicKey,
  });

  // 3) Sign & send
  const sig = await signAndSendSwap({ tx, signTransaction: wallet.signTransaction });
  return sig;
}
