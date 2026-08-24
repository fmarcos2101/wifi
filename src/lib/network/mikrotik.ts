import { encodeRestId, hotspotUserPayload } from "@/lib/network/hotspot";
import {
  createRouterOsClient,
  mikrotikConfigFromEnv,
  type RouterOsClient,
} from "@/lib/network/routeros";
import type { GrantAccessInput, NetworkController } from "@/lib/network/types";

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
