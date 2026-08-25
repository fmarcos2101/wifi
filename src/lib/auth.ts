import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { adminPassword, adminSecret } from "@/lib/config";

const COOKIE = "admin_session";

function sign(value: string) {
  return createHmac("sha256", adminSecret).update(value).digest("hex");
}

export function createAdminToken() {
  const payload = `ok.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminToken(token: string | undefined | null) {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const digest = token.slice(lastDot + 1);
  const expected = sign(payload);
  if (digest.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

export function passwordMatches(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(adminPassword);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return isValidAdminToken(store.get(COOKIE)?.value);
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
