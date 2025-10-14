// manifest.config.ts
export default {
  manifest_version: 3,
  name: "Beakin Wallet Widget",
  description:
    "A convenient tool to swap SHRIK, BKIN, and SOL tokens within the Beakin Network infrastructure, and to easily fund the Beakin app.",
  version: "1.0.0",

  action: { default_popup: "src/popup/index.html", default_title: "Beakin Wallet Widget" },

  // keep normal permissions lean
  permissions: ["storage", "scripting", "activeTab"],

  // ✅ request Web

  host_permissions: [
    "https://beakin.network/*",
    "https://mainnet.helius-rpc.com/*",
    "https://api.mainnet-beta.solana.com/*",
    "https://quote-api.jup.ag/*",
    "https://*.david-smiths-projects-2151599b.vercel.app/*",
    "https://beakin-jup-proxy-a6o7npht9-david-smiths-projects-2151599b.vercel.app/*"
  ],

  background: { service_worker: "src/background/index.ts", type: "module" },

  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';"
  },

  icons: { "16": "img/icon16.png", "48": "img/icon48.png", "128": "img/icon128.png" }
};
