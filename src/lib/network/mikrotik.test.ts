import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHotspotLoginUrl,
  encodeRestId,
  hotspotUserPayload,
  limitUptime,
} from "./hotspot";
import { createMikrotikNetwork } from "./mikrotik";
import type { RouterOsClient, RouterOsItem } from "./routeros";

test("limit-uptime usa horas e dias do RouterOS", () => {
  assert.equal(limitUptime(1), "1h");
  assert.equal(limitUptime(3), "3h");
  assert.equal(limitUptime(24), "1d");
});

test("payload do usuário inclui MAC e prazo", () => {
  assert.deepEqual(
    hotspotUserPayload({
      username: "wifi-abc",
      password: "secret",
      hours: 3,
      mac: "AA:BB:CC:DD:EE:FF",
    }),
    {
      name: "wifi-abc",
      password: "secret",
      "limit-uptime": "3h",
      comment: "wifi-pago",
      "mac-address": "AA:BB:CC:DD:EE:FF",
    },
  );
});

test("login do Hotspot leva usuário, senha e destino", () => {
  const href = buildHotspotLoginUrl({
    loginBase: "http://10.5.50.1/login",
    username: "wifi-abc",
    password: "secret",
    dst: "http://192.168.88.10:3000/conectado",
  });
  const url = new URL(href ?? "");
  assert.equal(url.origin, "http://10.5.50.1");
  assert.equal(url.searchParams.get("username"), "wifi-abc");
  assert.equal(url.searchParams.get("password"), "secret");
  assert.equal(
    url.searchParams.get("dst"),
    "http://192.168.88.10:3000/conectado",
  );
});

test("id REST do RouterOS é percent-encoded", () => {
  assert.equal(encodeRestId("*1A"), "%2A1A");
});

test("grant cria usuário novo no Hotspot", async () => {
  const calls: string[] = [];
  const client: RouterOsClient = {
    async get(path) {
      calls.push(`GET ${path}`);
      return [];
    },
    async put(path, body) {
      calls.push(`PUT ${path} ${body.name} ${body["limit-uptime"]}`);
      return body;
    },
    async patch() {
      throw new Error("não deveria atualizar");
    },
    async delete() {
      throw new Error("não deveria remover");
    },
  };

  await createMikrotikNetwork(client).grantAccess({
    username: "wifi-abc",
    password: "secret",
    hours: 1,
    mac: "AA:BB:CC:DD:EE:FF",
  });

  assert.deepEqual(calls, [
    "GET /ip/hotspot/user?name=wifi-abc",
    "PUT /ip/hotspot/user wifi-abc 1h",
  ]);
});

test("grant atualiza usuário que já existe", async () => {
  const calls: string[] = [];
  const client: RouterOsClient = {
    async get() {
      return [{ ".id": "*1", name: "wifi-abc" }];
    },
    async put() {
      throw new Error("não deveria criar");
    },
    async patch(path, body) {
      calls.push(`PATCH ${path} ${body["limit-uptime"]}`);
      return body;
    },
    async delete() {
      throw new Error("não deveria remover");
    },
  };

  await createMikrotikNetwork(client).grantAccess({
    username: "wifi-abc",
    password: "secret",
    hours: 6,
  });

  assert.deepEqual(calls, ["PATCH /ip/hotspot/user/%2A1 6h"]);
});

test("revoke derruba sessão ativa e apaga o usuário", async () => {
  const deleted: string[] = [];
  const client: RouterOsClient = {
    async get(path) {
      if (path.includes("/active")) {
        return [{ ".id": "*A", user: "wifi-abc" } satisfies RouterOsItem];
      }
      return [{ ".id": "*1", name: "wifi-abc" }];
    },
    async put() {
      return {};
    },
    async patch() {
      return {};
    },
    async delete(path) {
      deleted.push(path);
    },
  };

  await createMikrotikNetwork(client).revokeAccess("wifi-abc");
  assert.deepEqual(deleted, [
    "/ip/hotspot/active/%2AA",
    "/ip/hotspot/user/%2A1",
  ]);
});
