import { networkProvider } from "@/lib/config";
import { mikrotikNetwork } from "@/lib/network/mikrotik";
import { mockNetwork } from "@/lib/network/mock";
import type { NetworkController } from "@/lib/network/types";

export function getNetworkController(): NetworkController {
  if (networkProvider === "mikrotik") return mikrotikNetwork;
  return mockNetwork;
}

export function isMikrotikEnabled() {
  return networkProvider === "mikrotik";
}

export function networkLabel() {
  if (networkProvider !== "mikrotik") return "demo (sem roteador)";
  const host = process.env.MIKROTIK_HOST?.trim();
  return host ? `MikroTik ${host}` : "MikroTik (host não definido)";
}
