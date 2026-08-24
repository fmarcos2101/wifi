import type { GrantAccessInput, NetworkController } from "@/lib/network/types";

/**
 * Adapter for MikroTik Hotspot (RouterOS API).
 * Configure MIKROTIK_HOST / USER / PASSWORD when the router is available.
 * The hotspot user is created with limit-uptime equal to the paid hours.
 */
export const mikrotikNetwork: NetworkController = {
  async grantAccess(input: GrantAccessInput) {
    const host = process.env.MIKROTIK_HOST;
    if (!host) {
      throw new Error(
        "MikroTik não configurado. Defina NETWORK_PROVIDER=mock para o demo ou preencha MIKROTIK_HOST.",
      );
    }
    // Production: POST to RouterOS REST /ip/hotspot/user with limit-uptime.
    console.info("[network:mikrotik] grant (stub)", { host, ...input });
  },
  async revokeAccess(username: string) {
    const host = process.env.MIKROTIK_HOST;
    if (!host) return;
    console.info("[network:mikrotik] revoke (stub)", { host, username });
  },
};
