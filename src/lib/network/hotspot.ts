export function limitUptime(hours: number) {
  if (hours <= 0) return "1s";
  if (hours % 24 === 0) return `${hours / 24}d`;
  return `${hours}h`;
}

export function encodeRestId(id: string) {
  return id.replaceAll("*", "%2A");
}

export function hotspotUserPayload(input: {
  username: string;
  password: string;
  hours: number;
  mac?: string | null;
}) {
  const payload: Record<string, string> = {
    name: input.username,
    password: input.password,
    "limit-uptime": limitUptime(input.hours),
    comment: "wifi-pago",
  };
  if (input.mac) {
    payload["mac-address"] = input.mac;
  }
  return payload;
}

export function buildHotspotLoginUrl(input: {
  loginBase: string | null | undefined;
  username: string;
  password: string;
  dst?: string | null;
}) {
  if (!input.loginBase) return null;
  try {
    const url = new URL(input.loginBase);
    url.searchParams.set("username", input.username);
    url.searchParams.set("password", input.password);
    if (input.dst) url.searchParams.set("dst", input.dst);
    return url.toString();
  } catch {
    return null;
  }
}
