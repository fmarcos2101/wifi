import { appUrl } from "@/lib/config";
import type { RouterOsItem } from "@/lib/network/routeros";

export const WALLED_GARDEN_COMMENT = "wifi-pago";

const CAPTIVE_DETECT_HOSTS = [
  "captive.apple.com",
  "www.apple.com",
  "connectivitycheck.gstatic.com",
  "clients3.google.com",
  "www.msftconnecttest.com",
];

const PAYMENT_HOSTS = [
  "*.mercadopago.com",
  "*.mercadopago.com.br",
  "api.mercadopago.com",
  "api.mercadopago.com.br",
  "*.mlstatic.com",
  "*.mpago.la",
  "*.pagseguro.uol.com.br",
  "*.stripe.com",
];

export function hostFromAppUrl(url = appUrl) {
  if (!url) return null;
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

export function extraWalledGardenHosts() {
  return (process.env.WALLED_GARDEN_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

export function walledGardenHosts() {
  const appHost = hostFromAppUrl();
  return [
    ...(appHost ? [appHost] : []),
    ...PAYMENT_HOSTS,
    ...CAPTIVE_DETECT_HOSTS,
    ...extraWalledGardenHosts(),
  ].filter((host, index, all) => all.indexOf(host) === index);
}

export function openWrtFqdn(host: string) {
  return host.replace(/^\*\./, "");
}

export function renderWalledGardenScript(hosts = walledGardenHosts()) {
  const lines = [
    "# Walled garden: o hóspede só alcança o portal e o PIX até pagar.",
    "/ip hotspot walled-garden",
    ...hosts.map(
      (host) =>
        `add action=allow comment=${WALLED_GARDEN_COMMENT} dst-host=${host}`,
    ),
  ];
  return lines.join("\n");
}

export function renderOpenWrtWalledGardenScript(hosts = walledGardenHosts()) {
  const fqdns = hosts.map(openWrtFqdn);
  const unique = fqdns.filter((host, index) => fqdns.indexOf(host) === index);
  const lines = [
    "#!/bin/sh",
    "# Walled garden do openNDS: portal e PIX até o pagamento.",
    "# Cole no SSH do OpenWrt.",
    "set -e",
    ...unique.map(
      (host) =>
        `uci add_list opennds.@opennds[0].walledgarden_fqdn_list='${host}'`,
    ),
    "uci commit opennds",
    "/etc/init.d/opennds restart",
  ];
  return lines.join("\n");
}

export function missingWalledGardenHosts(
  existing: RouterOsItem[],
  hosts = walledGardenHosts(),
) {
  const already = new Set(
    existing
      .map((item) => item["dst-host"])
      .filter((host): host is string => Boolean(host)),
  );
  return hosts.filter((host) => !already.has(host));
}
