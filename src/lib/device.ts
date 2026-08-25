import { cookies } from "next/headers";

const MAC_COOKIE = "wifi_mac";
export const SESSION_COOKIE = "wifi_session";
export const LOGIN_COOKIE = "wifi_login";

export function sessionCookieOptions(endsAt: Date) {
  const maxAge = Math.max(60, Math.floor((endsAt.getTime() - Date.now()) / 1000));
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function normalizeMac(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) return null;
  return cleaned.slice(0, 32);
}

export async function rememberDeviceMac(mac: string | null) {
  if (!mac) return;
  const store = await cookies();
  store.set(MAC_COOKIE, mac, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getDeviceMac() {
  const store = await cookies();
  return normalizeMac(store.get(MAC_COOKIE)?.value);
}

export async function setGuestSessionCookie(sessionId: string, endsAt: Date) {
  const store = await cookies();
  const maxAge = Math.max(60, Math.floor((endsAt.getTime() - Date.now()) / 1000));
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function getGuestSessionId() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function rememberHotspotLogin(loginBase: string | null) {
  if (!loginBase) return;
  const store = await cookies();
  store.set(LOGIN_COOKIE, loginBase, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
}

export async function getHotspotLoginBase() {
  const store = await cookies();
  return store.get(LOGIN_COOKIE)?.value ?? process.env.MIKROTIK_LOGIN_URL?.trim() ?? null;
}

export async function clearGuestSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
