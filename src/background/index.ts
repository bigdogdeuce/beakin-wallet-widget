// src/background/index.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log("Beakin Wallet Widget installed");
});

// Optional: allow fetch to Jupiter/Helius from background if needed later
self.addEventListener("fetch", () => { /* no-op */ });
