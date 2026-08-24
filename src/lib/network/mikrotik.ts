import { encodeRestId, hotspotUserPayload } from "@/lib/network/hotspot";
import {
  createRouterOsClient,
  mikrotikConfigFromEnv,
  type RouterOsClient,
} from "@/lib/network/routeros";
import type { GrantAccessInput, NetworkController } from "@/lib/network/types";
import {
  WALLED_GARDEN_COMMENT,
  missingWalledGardenHosts,
  walledGardenHosts,
} from "@/lib/network/walled-garden";

export function createMikrotikNetwork(client: RouterOsClient): NetworkController {
  return {
    async grantAccess(input: GrantAccessInput) {
      const payload = hotspotUserPayload(input);
      const existing = await client.get(
        `/ip/hotspot/user?name=${encodeURIComponent(input.username)}`,
      );
      const id = existing[0]?.[".id"];
      if (id) {
        await client.patch(`/ip/hotspot/user/${encodeRestId(id)}`, payload);
        return;
      }
      await client.put("/ip/hotspot/user", payload);
    },

    async revokeAccess(username: string) {
      const active = await client.get(
        `/ip/hotspot/active?user=${encodeURIComponent(username)}`,
      );
      for (const item of active) {
        if (item[".id"]) {
          await client.delete(`/ip/hotspot/active/${encodeRestId(item[".id"])}`);
        }
      }

      const users = await client.get(
        `/ip/hotspot/user?name=${encodeURIComponent(username)}`,
      );
      for (const item of users) {
        if (item[".id"]) {
          await client.delete(`/ip/hotspot/user/${encodeRestId(item[".id"])}`);
        }
      }
    },
  };
}

export async function applyWalledGarden(
  client: RouterOsClient,
  hosts = walledGardenHosts(),
) {
  const existing = await client.get("/ip/hotspot/walled-garden");
  const missing = missingWalledGardenHosts(existing, hosts);
  for (const host of missing) {
    await client.put("/ip/hotspot/walled-garden", {
      "dst-host": host,
      action: "allow",
      comment: WALLED_GARDEN_COMMENT,
    });
  }
  return {
    added: missing,
    total: hosts.length,
  };
}

export async function applyWalledGardenFromEnv() {
  return applyWalledGarden(createRouterOsClient(mikrotikConfigFromEnv()));
}

export const mikrotikNetwork: NetworkController = {
  async grantAccess(input) {
    return createMikrotikNetwork(createRouterOsClient(mikrotikConfigFromEnv())).grantAccess(
      input,
    );
  },
  async revokeAccess(username) {
    return createMikrotikNetwork(createRouterOsClient(mikrotikConfigFromEnv())).revokeAccess(
      username,
    );
  },
};
