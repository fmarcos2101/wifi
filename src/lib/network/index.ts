import { networkProvider } from "@/lib/config";
import { mikrotikNetwork } from "@/lib/network/mikrotik";
import { mockNetwork } from "@/lib/network/mock";
import { openwrtNetwork } from "@/lib/network/openwrt";
import type { NetworkController } from "@/lib/network/types";

export function getNetworkController(): NetworkController {
  if (networkProvider === "mikrotik") return mikrotikNetwork;
  if (networkProvider === "openwrt") return openwrtNetwork;
  return mockNetwork;
}

export function isMikrotikEnabled() {
  return networkProvider === "mikrotik";
}

export function isOpenWrtEnabled() {
  return networkProvider === "openwrt";
}

export function networkLabel() {
  if (networkProvider === "mikrotik") {
    const host = process.env.MIKROTIK_HOST?.trim();
    return host ? `MikroTik ${host}` : "MikroTik (host não definido)";
  }
  if (networkProvider === "openwrt") {
    const host = process.env.OPENWRT_HOST?.trim();
    return host ? `OpenWrt ${host}` : "OpenWrt (host não definido)";
  }
  return "demo (sem roteador)";
}
