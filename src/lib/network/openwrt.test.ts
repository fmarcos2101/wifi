import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createOpenWrtNetwork,
  formatOpenWrtMac,
  ndsctlAuthArgs,
  ndsctlDeauthArgs,
  sessionMinutes,
} from "./openwrt";
import { renderOpenWrtWalledGardenScript } from "./walled-garden";

test("openNDS usa minutos e MAC em minúsculas", () => {
  assert.equal(sessionMinutes(1), 60);
  assert.equal(sessionMinutes(3), 180);
  assert.equal(formatOpenWrtMac("AA-BB-CC-00-00-01"), "aa:bb:cc:00:00:01");
  assert.deepEqual(ndsctlAuthArgs("AA:BB:CC:00:00:01", 1), [
    "auth",
    "aa:bb:cc:00:00:01",
    "60",
  ]);
  assert.deepEqual(ndsctlDeauthArgs("AA:BB:CC:00:00:01"), [
    "deauth",
    "aa:bb:cc:00:00:01",
  ]);
});

test("grant no OpenWrt chama ndsctl auth com o prazo", async () => {
  const calls: string[] = [];
  const network = createOpenWrtNetwork(async (command, params) => {
    calls.push(`${command} ${params.join(" ")}`);
    return "ok";
  });

  await network.grantAccess({
    username: "wifi-abc",
    password: "x",
    hours: 3,
    mac: "AA:BB:CC:00:00:01",
  });

  assert.deepEqual(calls, ["/usr/bin/ndsctl auth aa:bb:cc:00:00:01 180"]);
});

test("grant no OpenWrt exige MAC", async () => {
  const network = createOpenWrtNetwork(async () => "ok");
  await assert.rejects(
    () =>
      network.grantAccess({
        username: "wifi-abc",
        password: "x",
        hours: 1,
      }),
    /MAC/,
  );
});

test("revoke no OpenWrt chama ndsctl deauth", async () => {
  const calls: string[] = [];
  const network = createOpenWrtNetwork(async (command, params) => {
    calls.push(`${command} ${params.join(" ")}`);
    return "ok";
  });
  await network.revokeAccess({
    username: "wifi-abc",
    mac: "AA:BB:CC:00:00:01",
  });
  assert.deepEqual(calls, ["/usr/bin/ndsctl deauth aa:bb:cc:00:00:01"]);
});

test("script OpenWrt usa FQDN sem curinga", () => {
  const script = renderOpenWrtWalledGardenScript([
    "hotel.exemplo.com",
    "*.mercadopago.com",
  ]);
  assert.match(script, /walledgarden_fqdn_list='hotel.exemplo.com'/);
  assert.match(script, /walledgarden_fqdn_list='mercadopago.com'/);
  assert.doesNotMatch(script, /\*\.mercadopago/);
});
