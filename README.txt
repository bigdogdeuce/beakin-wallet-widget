# Beakin Wallet (TXT starter)
These are plaintext `.txt` files containing TypeScript/TSX boilerplate for a Manifest V3 Chrome extension wallet.
You can edit them freely, then later rename to real `.ts` / `.tsx` / `.html` files and build.

## What to do next (Step-by-step)
1) Unzip this anywhere (Desktop is fine).
2) Review and tweak the `.txt` files you care about first:
   - manifest_config.txt → name/description/version
   - tokens_lib.txt → confirm SHRIK decimals (BKIN is 9)
   - swap_page.txt → later add BKIN routes, slippage control, etc.
3) When ready to build:
   - Create a new folder (can reuse this one), initialize npm and install deps:
     npm init -y
     npm install vite react react-dom @crxjs/vite-plugin @solana/web3.js @solana/spl-token bip39 ed25519-hd-key tweetnacl @jup-ag/core @jup-ag/api
   - Rename files:
     * manifest_config.txt → manifest.config.ts
     * vite_config.txt → vite.config.ts
     * src/popup/popup_index_html.txt → src/popup/index.html
     * src/popup/popup_main_tsx.txt → src/popup/main.tsx
     * src/popup/popup_App_tsx.txt → src/popup/App.tsx
     * Everything in src/lib/*.txt → .ts
     * Pages in src/popup/pages/*.txt → .tsx
     * src/background/background_index.txt → src/background/index.ts
     * src/content/content_index.txt → src/content/index.ts
   - Put some icon PNGs in /public (16/48/128 px) or update manifest to remove them for now.
   - Build:
     npm run build
   - Load `dist/` as an unpacked extension in chrome://extensions.

## Notes
- Default RPC is mainnet-beta; you can change it in src/lib/solana.ts
- Jupiter slippage default is 0.5% (50 bps) in src/lib/jupiter.ts
- Seed phrase is stored encrypted in chrome.storage.local (AES-GCM via PBKDF2).
- This is an MVP for learning/testing; audit before production.
