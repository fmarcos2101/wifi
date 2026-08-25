import type { GrantAccessInput, NetworkController } from "@/lib/network/types";
import {
  createUbusClient,
  openWrtConfigFromEnv,
  type UbusExec,
} from "@/lib/network/openwrt-ubus";

export function formatOpenWrtMac(mac: string) {
  return mac.trim().toLowerCase().replaceAll("-", ":");
}

export function sessionMinutes(hours: number) {
  return Math.max(1, Math.round(hours * 60));
}

export function ndsctlAuthArgs(mac: string, hours: number) {
  return ["auth", formatOpenWrtMac(mac), String(sessionMinutes(hours))];
}

export function ndsctlDeauthArgs(mac: string) {
  return ["deauth", formatOpenWrtMac(mac)];
}

export function ndsctlBin() {
  return process.env.OPENWRT_NDSCTL?.trim() || "/usr/bin/ndsctl";
}

export function createOpenWrtNetwork(exec: UbusExec): NetworkController {
  return {
    async grantAccess(input: GrantAccessInput) {
      if (!input.mac) {
        throw new Error(
          "OpenWrt precisa do MAC do aparelho. O openNDS envia clientmac na URL do portal.",
        );
      }
      await exec(ndsctlBin(), ndsctlAuthArgs(input.mac, input.hours));
    },
    async revokeAccess(input) {
      if (!input.mac) return;
      await exec(ndsctlBin(), ndsctlDeauthArgs(input.mac));
    },
  };
}

export const openwrtNetwork: NetworkController = {
  async grantAccess(input) {
    return createOpenWrtNetwork(createUbusClient(openWrtConfigFromEnv()).exec).grantAccess(
      input,
    );
  },
  async revokeAccess(input) {
    return createOpenWrtNetwork(createUbusClient(openWrtConfigFromEnv()).exec).revokeAccess(
      input,
    );
  },
};
