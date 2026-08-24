import { headers } from "next/headers";
import { appUrl } from "@/lib/config";
import { getHotspotLoginBase } from "@/lib/device";
import { isMikrotikEnabled } from "@/lib/network";
import { buildHotspotLoginUrl } from "@/lib/network/hotspot";

export async function appOrigin() {
  if (appUrl) return appUrl;
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return "";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function mikrotikLoginHref(session: {
  networkUser: string | null;
  networkPassword: string | null;
}) {
  if (!isMikrotikEnabled()) return null;
  if (!session.networkUser || !session.networkPassword) return null;
  const origin = await appOrigin();
  return buildHotspotLoginUrl({
    loginBase: await getHotspotLoginBase(),
    username: session.networkUser,
    password: session.networkPassword,
    dst: origin ? `${origin}/conectado` : null,
  });
}
