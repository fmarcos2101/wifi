export type OpenWrtConfig = {
  host: string;
  user: string;
  password: string;
  protocol?: "http" | "https";
  port?: number;
};

type UbusResponse = {
  error?: { message?: string };
  result?: [number, Record<string, unknown>?];
};

export type UbusExec = (command: string, params: string[]) => Promise<string>;

export function openWrtConfigFromEnv(): OpenWrtConfig {
  const host = process.env.OPENWRT_HOST?.trim();
  if (!host) {
    throw new Error(
      "OpenWrt não configurado. Defina OPENWRT_HOST, OPENWRT_USER e OPENWRT_PASSWORD.",
    );
  }
  return {
    host,
    user: process.env.OPENWRT_USER?.trim() || "root",
    password: process.env.OPENWRT_PASSWORD ?? "",
    protocol: process.env.OPENWRT_PROTOCOL === "https" ? "https" : "http",
    port: process.env.OPENWRT_PORT ? Number(process.env.OPENWRT_PORT) : undefined,
  };
}

export function createUbusClient(
  config: OpenWrtConfig,
  fetchImpl: typeof fetch = fetch,
): { exec: UbusExec } {
  const protocol = config.protocol ?? "http";
  const port = config.port ? `:${config.port}` : "";
  const endpoint = `${protocol}://${config.host}${port}/ubus`;
  let requestId = 1;

  async function call(
    sid: string,
    object: string,
    method: string,
    args: Record<string, unknown>,
  ) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: requestId++,
        method: "call",
        params: [sid, object, method, args],
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      throw new Error(`OpenWrt ${response.status} /ubus${detail ? `: ${detail}` : ""}`);
    }
    const json = (await response.json()) as UbusResponse;
    if (json.error?.message) {
      throw new Error(`OpenWrt ubus: ${json.error.message}`);
    }
    const code = json.result?.[0];
    if (code !== 0) {
      throw new Error(`OpenWrt ubus código ${code ?? "desconhecido"}`);
    }
    return json.result?.[1] ?? {};
  }

  return {
    async exec(command: string, params: string[]) {
      const login = await call("00000000000000000000000000000000", "session", "login", {
        username: config.user,
        password: config.password,
      });
      const sid = String(login.ubus_rpc_session ?? "");
      if (!sid) throw new Error("OpenWrt: falha no login ubus");

      const data = await call(sid, "file", "exec", { command, params });
      const exitCode = Number(data.code ?? 0);
      const stdout = String(data.stdout ?? "");
      const stderr = String(data.stderr ?? "");
      if (exitCode !== 0) {
        throw new Error(`ndsctl falhou (${exitCode}): ${stderr || stdout || "sem detalhe"}`);
      }
      return stdout;
    },
  };
}
