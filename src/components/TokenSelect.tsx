// src/components/TokenSelect.tsx
"use client";
import React from "react";
import { orderedTokens, TokenMeta } from "@/lib/tokens";

type Props = {
  value: string; // mint address
  onChange: (mint: string) => void;
  label?: string;
};

export default function TokenSelect({ value, onChange, label }: Props) {
  const tokens = orderedTokens();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label ? (
        <label style={{ fontSize: 12, opacity: 0.8 }}>{label}</label>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#111",
          color: "#eee",
        }}
      >
        {tokens.map((t: TokenMeta) => (
          <option key={t.mint} value={t.mint}>
            {t.symbol} — {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
