// src/popup/pages/SwapPage.tsx
import React, { useMemo, useState } from "react";
import { PublicKey, Connection, VersionedTransaction } from "@solana/web3.js";
import { TOKENS, SUPPORTED_TOKENS, SupportedToken, getTokenDef } from "../../lib/tokens";

declare global {
  interface Window {
    solflare?: {
      isSolflare?: boolean;
      publicKey?: PublicKey;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      signTransaction?: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
      signAndSendTransaction?: (tx: VersionedTransaction, opts?: any) => Promise<{ signature: string }>;
    };
  }
}

const ENV_RPC = (import.meta as any)?.env?.VITE_HELIUS_URL as string | undefined;
const RPC_URL = ENV_RPC && typeof ENV_RPC === "string" && ENV_RPC.length > 0
  ? ENV_RPC
  : "https://api.mainnet-beta.solana.com";

const SLIPPAGE_BPS_DEFAULT = 50; // 0.5%

// Route all Jupiter calls through your Vercel proxy
const PROXY_BASE = "https://beakin-jup-proxy-r4u18523e-david-smiths-projects-2151599b.vercel.app";
const QUOTE_URL = `${PROXY_BASE}/api/jup/v6/quote`;
const SWAP_URL  = `${PROXY_BASE}/api/jup/v6/swap`;

function uiToAtomicStr(ui: string, decimals: number): string {
  if (!ui || Number(ui) === 0) return "0";
  const [iRaw, fRaw = ""] = ui.trim().split(".");
  const i = (iRaw || "0").replace(/\D/g, "") || "0";
  const fClean = (fRaw || "").replace(/\D/g, "");
  const f = fClean.slice(0, decimals).padEnd(decimals, "0");
  const combined = i + f;
  const normalized = combined.replace(/^0+(?=\d)/, "") || "0";
  return normalized;
}
function atomicToUiStr(atomic: string, decimals: number): string {
  const s = (atomic || "0").replace(/\D/g, "") || "0";
  if (decimals === 0) return s;
  const pad = s.padStart(decimals + 1, "0");
  const head = pad.slice(0, -decimals);
  const tail = pad.slice(-decimals);
  const tailTrimmed = tail.replace(/0+$/, "");
  return tailTrimmed.length ? `${head}.${tailTrimmed}` : head;
}

export default function SwapPage() {
  const [fromSym, setFromSym] = useState<SupportedToken>("SHRIK");
  const [toSym, setToSym] = useState<SupportedToken>("SOL");
  const [amountUi, setAmountUi] = useState<string>("0.0");
  const [slippageBps, setSlippageBps] = useState<number>(SLIPPAGE_BPS_DEFAULT);
  const [quote, setQuote] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [walletAddr, setWalletAddr] = useState<string>("");

  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const fromToken = getTokenDef(fromSym);
  const toToken = getTokenDef(toSym);

  async function connectWallet() {
    try {
      if (!window.solflare || !window.solflare.connect) {
        setStatus("Solflare extension not detected.");
        return;
      }
      setStatus("Connecting wallet...");
      await window.solflare.connect();
      const pk = window.solflare.publicKey;
      if (!pk) throw new Error("No public key returned by Solflare.");
      setWalletAddr(pk.toBase58());
      setStatus("Wallet connected.");
    } catch (e: any) {
      setStatus(e.message || "Wallet connect error");
    }
  }

  async function fetchQuote() {
    try {
      setStatus("Fetching quote...");
      const amountAtomic = uiToAtomicStr(amountUi || "0", fromToken.decimals);
      if (amountAtomic === "0") {
        setStatus("Enter a non-zero amount.");
        setQuote(null);
        return;
      }
      const params = new URLSearchParams({
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        amount: amountAtomic,
        slippageBps: String(slippageBps),
        onlyDirectRoutes: "false",
        asLegacyTransaction: "false"
      });
      const res = await fetch(`${QUOTE_URL}?${params.toString()}`);
      if (!res.ok) throw new Error(`Quote failed: ${await res.text()}`);
      const data = await res.json();
      setQuote(data);
      setStatus("Quote ready");
    } catch (e: any) {
      setStatus(e.message || "Quote error");
      setQuote(null);
    }
  }

  async function buildAndSendSwap() {
    if (!quote) return;
    try {
      if (!window.solflare?.publicKey) {
        setStatus("Connect Solflare first.");
        return;
      }
      setStatus("Building swap transaction...");
      const swapReq = {
        quoteResponse: quote,
        userPublicKey: window.solflare.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        asLegacyTransaction: false,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: { maxBps: slippageBps }
      };
      const res = await fetch(SWAP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapReq)
      });
      if (!res.ok) throw new Error(`Swap build failed: ${await res.text()}`);
      const { swapTransaction } = await res.json();
      const rawTx = Buffer.from(swapTransaction, "base64");
      const tx = VersionedTransaction.deserialize(rawTx);

      let signature: string | undefined;
      if (window.solflare.signAndSendTransaction) {
        setStatus("Requesting wallet signature...");
        const result = await window.solflare.signAndSendTransaction(tx, { skipPreflight: false });
        signature = result?.signature;
      } else if (window.solflare.signTransaction) {
        setStatus("Requesting wallet signature...");
        const signed = await window.solflare.signTransaction(tx);
        setStatus("Sending transaction...");
        signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
      } else {
        throw new Error("Solflare provider lacks signing capability.");
      }

      if (!signature) throw new Error("No transaction signature returned.");
      setStatus("Confirming transaction...");
      await connection.confirmTransaction(signature, "confirmed");
      setStatus(`Swap complete. Sig: ${signature}`);
    } catch (e: any) {
      setStatus(e.message || "Swap error");
    }
  }

  return (
    <div className="p-4 space-y-3 text-sm">
      <h2 className="text-lg font-semibold">Swap</h2>

      <div className="flex items-center gap-2">
        <button onClick={connectWallet} className="border rounded px-3 py-2">
          {walletAddr ? "Connected" : "Connect Solflare"}
        </button>
        {walletAddr && <span className="text-xs opacity-80 break-all">{walletAddr}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col">
          <span className="mb-1">From</span>
          <select
            value={fromSym}
            onChange={(e) => {
              const v = e.target.value as SupportedToken;
              setFromSym(v);
              if (v === toSym) {
                const alt = SUPPORTED_TOKENS.find(t => t !== v) || "SOL";
                setToSym(alt as SupportedToken);
              }
            }}
            className="border rounded p-2"
          >
            {SUPPORTED_TOKENS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="mb-1">To</span>
          <select
            value={toSym}
            onChange={(e) => {
              const v = e.target.value as SupportedToken;
              setToSym(v);
              if (v === fromSym) {
                const alt = SUPPORTED_TOKENS.find(t => t !== v) || "SOL";
                setFromSym(alt as SupportedToken);
              }
            }}
            className="border rounded p-2"
          >
            {SUPPORTED_TOKENS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col">
        <span className="mb-1">Amount ({fromSym})</span>
        <input
          type="number"
          min="0"
          step="any"
          value={amountUi}
          onChange={(e) => setAmountUi(e.target.value)}
          className="border rounded p-2"
          placeholder="0.0"
        />
      </label>

      <label className="flex flex-col">
        <span className="mb-1">Slippage (bps)</span>
        <input
          type="number"
          min={1}
          max={500}
          value={slippageBps}
          onChange={(e) => setSlippageBps(parseInt(e.target.value || "0", 10))}
          className="border rounded p-2"
        />
        <span className="mt-1 opacity-70">Locked default: 50 bps (0.5%)</span>
      </label>

      <div className="flex gap-2">
        <button onClick={fetchQuote} className="border rounded px-3 py-2">Get Quote</button>
        <button
          onClick={buildAndSendSwap}
          className="border rounded px-3 py-2"
          disabled={!quote || !walletAddr}
        >
          Swap
        </button>
      </div>

      <div className="min-h-[1.5rem] text-xs opacity-80">{status}</div>

      {quote && (
        <div className="border rounded p-2 text-xs space-y-1">
          <div>In: {amountUi} {fromSym}</div>
          <div>
            Out est.: {atomicToUiStr(String(quote.outAmount ?? "0"), toToken.decimals)} {toSym}
          </div>
          {quote.priceImpactPct !== undefined && (
            <div>Price impact: {(Number(quote.priceImpactPct) * 100).toFixed(2)}%</div>
          )}
          <div>Routes: {Array.isArray(quote.routePlan) ? quote.routePlan.length : 0}</div>
        </div>
      )}
    </div>
  );
}
