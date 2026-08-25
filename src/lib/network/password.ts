import { randomBytes } from "crypto";

export function randomHotspotPassword() {
  return randomBytes(4).toString("hex");
}
