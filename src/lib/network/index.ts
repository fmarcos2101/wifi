import { networkProvider } from "@/lib/config";
import { mikrotikNetwork } from "@/lib/network/mikrotik";
import { mockNetwork } from "@/lib/network/mock";
import type { NetworkController } from "@/lib/network/types";

export function getNetworkController(): NetworkController {
  if (networkProvider === "mikrotik") return mikrotikNetwork;
  return mockNetwork;
}
