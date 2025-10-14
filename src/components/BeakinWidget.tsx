// src/components/BeakinWidget.tsx
import React, { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import { getQuote, getPrices } from "../lib/jup";

type QuoteData = any;
type PriceData = any;

const GOLD = "#FACC15";      // Beakin gold accent
const BG_DARK = "#0b0b0b";   // page background vibe
const PANEL_BG = "#171717";  // card/panel background
const TEXT = "#e7e7e7";      // primary text
const MUTED = "rgba(255,255,255,.6)";
const BORDER = "rgba(255,255,255,.08)";
const LOGO =
  typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("img/icon128.png")
    : "/img/icon128.png";

const SOL_MINT  = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// ---- helpers ---------------------------------------------------------------
function isFiniteNum(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n);
}
const fmt = (n: number | undefined, d = 4) => {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, d),
    maximumFractionDigits: d,
  });
};
function findPrice(p: any, sym: string, mint: string) {
  return (
    p?.data?.[sym]?.price ??
    p?.data?.[mint]?.price ??
    p?.[sym]?.price ??
    p?.[mint]?.price ??
    (typeof p?.[sym] === "number" ? p[sym] : undefined) ??
    (typeof p?.[mint] === "number" ? p[mint] : undefined)
  );
}
function shortKey(k: PublicKey | null | undefined, chars = 4) {
  if (!k) return "";
  const s = k.toBase58();
  return `${s.slice(0, chars)}…${s.slice(-chars)}`;
}

// ---- component -------------------------------------------------------------
export default function BeakinWidget() {
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // wallet state
  const { publicKey, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  // 0.1 SOL in lamports
  const amountLamports = 100_000_000;

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setErr(null);
      try {
        const p = await getPrices(["SOL", "USDC"]);
        setPrice(p);

        const q = await getQuote({
          outputMint: USDC_MINT, // demo panel: SOL -> USDC
          amount: amountLamports,
          slippageBps: 50,
          restrictIntermediateTokens: true,
        });
        setQuote(q);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const solPrice  = findPrice(price, "SOL",  SOL_MINT);
  const usdcPrice = findPrice(price, "USDC", USDC_MINT) ?? 1;

  // Jupiter quote usually expresses USDC outAmount in 1e6
  const outUSDC =
    quote?.outAmount !== undefined
      ? Number(quote.outAmount) / 1_000_000
      : quote?.routePlan?.[0]?.swapInfo?.outAmount
      ? Number(quote.routePlan[0].swapInfo.outAmount) / 1_000_000
      : undefined;

  const amountSol = amountLamports / 1_000_000_000; // 0.1
  const solPriceFallback =
    isFiniteNum(outUSDC) && amountSol > 0 ? outUSDC / amountSol : undefined;
  const solPriceDisplay = isFiniteNum(solPrice) ? solPrice : solPriceFallback;

  // UI bits for wallet
  const walletLabel = connected
    ? shortKey(publicKey)
    : connecting
    ? "Connecting…"
    : "Select Wallet";

  const onWalletClick = () => setVisible(true);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <img src={LOGO} alt="Beakin" style={styles.logo} />
            <div style={styles.title}>Beakin Wallet Widget</div>

            {/* Right-aligned wallet status button */}
            <div style={{ flex: 1 }} />
            <button
              onClick={onWalletClick}
              style={{
                ...styles.button,
                padding: "8px 12px",
                background: connected ? "transparent" : GOLD,
                color: connected ? GOLD : "#0b0b0b",
                border: `1px solid ${connected ? GOLD : BORDER}`,
              }}
              title={publicKey ? publicKey.toBase58() : "Connect a wallet"}
            >
              {walletLabel}
            </button>
          </div>

          <div style={styles.subHeaderRow}>
            <span style={styles.badge}>
              <strong style={{ fontWeight: 800 }}>Beakin</strong>
              <span style={{ opacity: 0.65, margin: "0 6px" }}>·</span>
              <span>Jupiter</span>
            </span>

            <button onClick={load} disabled={loading} style={styles.button}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={styles.grid}>
          {/* Price panel */}
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Price Snapshot</div>
            {!loading && !err ? (
              <div style={{ marginTop: 10 }}>
                <Row
                  label="SOL"
                  value={`$${fmt(solPriceDisplay)}`}
                  mono
                  accent={isFiniteNum(solPriceDisplay)}
                />
                <Row label="USDC" value={`$${fmt(usdcPrice)}`} mono />
              </div>
            ) : (
              <Skeleton />
            )}
          </div>

          {/* Quote panel */}
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Quote · SOL → USDC (DEMO)</div>
            {!loading && !err ? (
              <div style={{ marginTop: 10 }}>
                <Row label="Input (SOL)" value={"0.1"} mono />
                <Row label="Out (approx USDC)" value={fmt(outUSDC, 3)} mono accent />
                <Row
                  label="Routes"
                  value={String(quote?.routePlan?.length ?? quote?.routes?.length ?? 1)}
                />
              </div>
            ) : (
              <Skeleton />
            )}
          </div>
        </div>

        {/* Swap panel (UI-only enable/disable for now) */}
        <div style={{ ...styles.panel, marginTop: 14 }}>
          <div style={styles.panelTitle}>Swap</div>

          {/* Amount input (display only) */}
          <div style={{ marginTop: 10 }}>
            <div style={{ color: MUTED, marginBottom: 6, fontSize: 12 }}>Amount</div>
            <div
              style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "10px 12px",
                background: "rgba(255,255,255,.02)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              0.10
            </div>
          </div>

          {/* Buttons row */}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button style={{ ...styles.bigBtn, flex: 1 }}>Get Quote</button>
            <button
              onClick={connected ? undefined : onWalletClick}
              style={{
                ...styles.bigBtn,
                flex: 1,
                background: connected ? "rgba(34,197,94,.15)" : GOLD,
                color: connected ? "#86efac" : "#0b0b0b",
                borderColor: connected ? "rgba(34,197,94,.35)" : BORDER,
                cursor: connected ? "default" : "pointer",
              }}
              disabled={connected}
              title={
                connected
                  ? publicKey?.toBase58()
                  : "Click to connect a wallet"
              }
            >
              {connected ? "Connected" : "Connect Wallet"}
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div style={styles.error}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Issue fetching data</div>
            <div style={{ opacity: 0.9 }}>{err}</div>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={{ color: MUTED }}>Frame v1.2 · Dark + Gold</div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div style={styles.row}>
      <span style={{ color: MUTED }}>{label}</span>
      <span
        style={{
          ...styles.pill,
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          color: accent ? BG_DARK : TEXT,
          background: accent ? GOLD : "rgba(255,255,255,.06)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={styles.skel(86)} />
      <div style={styles.skel(64)} />
      <div style={styles.skel(48)} />
    </div>
  );
}

const styles: Record<string, any> = {
  wrap: { width: "100%", maxWidth: 440, minWidth: 380, padding: 8, boxSizing: "border-box" },
  card: {
    position: "relative",
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: `radial-gradient(1200px 500px at 10% -20%, rgba(250,204,21,.08), transparent 60%),
                 linear-gradient(180deg, #121212, ${BG_DARK})`,
    boxShadow: "0 18px 60px rgba(0,0,0,.45)",
    padding: 16,
    color: TEXT,
  },
  header: { display: "flex", flexDirection: "column", gap: 8 },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#000",
    objectFit: "cover",
    padding: 2,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 0 0 3px rgba(250,204,21,.15)",
  },
  title: { color: GOLD, fontWeight: 900, fontSize: 22, letterSpacing: 0.2 },
  subHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(250,204,21,.10)",
    color: GOLD,
    border: `1px solid rgba(250,204,21,.35)`,
    fontSize: 12,
  },
  button: {
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: GOLD,
    color: "#0b0b0b",
    cursor: "pointer",
    fontWeight: 700,
  },
  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  panel: {
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: PANEL_BG,
    boxShadow: "inset 0 1px 3px rgba(0,0,0,.25)",
    padding: 12,
    minHeight: 110,
  },
  panelTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: MUTED,
    fontWeight: 800,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    fontSize: 14,
  },
  pill: {
    marginLeft: 8,
    padding: "3px 10px",
    borderRadius: 8,
    fontWeight: 700,
    border: `1px solid ${BORDER}`,
  },
  bigBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 800,
  },
  error: {
    marginTop: 14,
    borderRadius: 10,
    border: "1px solid rgba(220,38,38,.35)",
    background: "rgba(254,226,226,.06)",
    color: "#fecaca",
    padding: 10,
    fontSize: 12,
  },
  footer: { marginTop: 12, display: "flex", justifyContent: "flex-end", fontSize: 11 },
  skel: (w: number) => ({
    height: 10,
    width: `${w}%`,
    borderRadius: 6,
    background: "rgba(255,255,255,.08)",
    marginBottom: 8,
    animation: "pulse 1.2s ease-in-out infinite",
  }),
};
