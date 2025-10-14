// src/lib/ledger.ts
export async function requestLedgerWebHID(): Promise<boolean> {
  const nav = navigator as any;
  if (!('hid' in nav)) {
    throw new Error("WebHID not available in this browser/profile.");
  }
  // Ledger vendor ID
  const filters = [{ vendorId: 0x2c97 }];
  // This opens Chrome’s device picker – must be triggered by a click
  const devices = await nav.hid.requestDevice({ filters });
  return Array.isArray(devices) && devices.length > 0;
}
