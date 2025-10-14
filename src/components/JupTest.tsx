import React, { useState } from "react";
import { getQuote, getPrices } from "../lib/jup";

export default function JupTest() {
  const [quote, setQuote] = useState<any>(null);
  const [price, setPrice] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const testQuote = async () => {
    setBusy(true); setErr(null);
    try {
      const q = await getQuote({
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: 100000000,
        slippageBps: 50,
        restrictIntermediateTokens: true,
      });
      setQuote(q);
    } catch (e: any) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  };

  const testPrice = async () => {
    setBusy(true); setErr(null);
    try {
      const p = await getPrices(["SOL","USDC"]);
      setPrice(p);
    } catch (e: any) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{fontFamily:"system-ui, sans-serif", padding:16, lineHeight:1.4}}>
      <h2>Jupiter Proxy Smoke Test</h2>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
        <button disabled={busy} onClick={testQuote}>Test Quote (1 SOL → USDC)</button>
        <button disabled={busy} onClick={testPrice}>Test Price (SOL, USDC)</button>
        {busy && <span>…working</span>}
      </div>
      {err && <pre style={{background:"#330",color:"#faa",padding:12,borderRadius:8}}>{err}</pre>}
      <section>
        <div style={{opacity:.7, marginBottom:4}}>Quote result</div>
        <pre style={{background:"#111",color:"#0f0",padding:12,borderRadius:8,overflow:"auto"}}>
{JSON.stringify(quote, null, 2)}
        </pre>
      </section>
      <section>
        <div style={{opacity:.7, marginBottom:4}}>Price result</div>
        <pre style={{background:"#111",color:"#0f0",padding:12,borderRadius:8,overflow:"auto"}}>
{JSON.stringify(price, null, 2)}
        </pre>
      </section>
    </div>
  );
}
