import type { GrantAccessInput, NetworkController } from "@/lib/network/types";

export const mockNetwork: NetworkController = {
  async grantAccess(input: GrantAccessInput) {
    console.info("[network:mock] grant", input);
  },
  async revokeAccess(username: string) {
    console.info("[network:mock] revoke", username);
  },
};
