export type RouterOsConfig = {
  host: string;
  user: string;
  password: string;
  protocol?: "http" | "https";
  port?: number;
};

export type RouterOsItem = {
  ".id"?: string;
  name?: string;
  user?: string;
  [key: string]: string | undefined;
};

export type RouterOsClient = {
  get: (path: string) => Promise<RouterOsItem[]>;
  put: (path: string, body: Record<string, string>) => Promise<unknown>;
  patch: (path: string, body: Record<string, string>) => Promise<unknown>;
  delete: (path: string) => Promise<void>;
};

function restUrl(config: RouterOsConfig, path: string) {
  const protocol = config.protocol ?? "http";
  const port = config.port ? `:${config.port}` : "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${protocol}://${config.host}${port}/rest${normalized}`;
}

export function createRouterOsClient(
  config: RouterOsConfig,
  fetchImpl: typeof fetch = fetch,
): RouterOsClient {
  const authorization = `Basic ${Buffer.from(`${config.user}:${config.password}`).toString("base64")}`;

  async function request(path: string, init: RequestInit = {}) {
    const response = await fetchImpl(restUrl(config, path), {
      ...init,
      headers: {
        authorization,
        accept: "application/json",
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      throw new Error(`MikroTik ${response.status} ${path}${detail ? `: ${detail}` : ""}`);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as unknown;
  }

  return {
    async get(path: string) {
      const data = await request(path);
      if (Array.isArray(data)) return data as RouterOsItem[];
      if (data && typeof data === "object") return [data as RouterOsItem];
      return [];
    },
    async put(path: string, body: Record<string, string>) {
      return request(path, { method: "PUT", body: JSON.stringify(body) });
    },
    async patch(path: string, body: Record<string, string>) {
      return request(path, { method: "PATCH", body: JSON.stringify(body) });
    },
    async delete(path: string) {
      await request(path, { method: "DELETE" });
    },
  };
}

export function mikrotikConfigFromEnv(): RouterOsConfig {
  const host = process.env.MIKROTIK_HOST?.trim();
  if (!host) {
    throw new Error(
      "MikroTik não configurado. Defina MIKROTIK_HOST, MIKROTIK_USER e MIKROTIK_PASSWORD.",
    );
  }

  return {
    host,
    user: process.env.MIKROTIK_USER?.trim() || "admin",
    password: process.env.MIKROTIK_PASSWORD ?? "",
    protocol: process.env.MIKROTIK_PROTOCOL === "https" ? "https" : "http",
    port: process.env.MIKROTIK_PORT ? Number(process.env.MIKROTIK_PORT) : undefined,
  };
}
