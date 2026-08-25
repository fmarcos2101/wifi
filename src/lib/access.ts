import { prisma } from "@/lib/db";
import { getNetworkController } from "@/lib/network";
import { randomHotspotPassword } from "@/lib/network/password";
import type { Prisma } from "@prisma/client";

export async function expireOverdueSessions(now = new Date()) {
  const overdue = await prisma.session.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
  });

  if (overdue.length === 0) return 0;

  const network = getNetworkController();
  for (const session of overdue) {
    await network.revokeAccess({
      username: session.networkUser ?? "",
      mac: session.deviceMac,
    });
  }

  await prisma.session.updateMany({
    where: { id: { in: overdue.map((session) => session.id) } },
    data: { status: "EXPIRED" },
  });

  await prisma.auditLog.create({
    data: {
      action: "ACCESS_EXPIRED",
      detail: `${overdue.length} sessão(ões) encerrada(s) por tempo`,
    },
  });

  return overdue.length;
}

export async function getActiveSessionById(id: string) {
  await expireOverdueSessions();
  return prisma.session.findFirst({
    where: { id, status: "ACTIVE", endsAt: { gt: new Date() } },
    include: { plan: true, order: true },
  });
}

export async function grantPaidAccess(orderId: string) {
  await expireOverdueSessions();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { session: true, plan: true },
  });

  if (!order) throw new Error("Pedido não encontrado");
  if (order.status !== "PAID") throw new Error("Pagamento ainda não confirmado");
  if (order.session) return order.session;

  const networkUser = `wifi-${order.id.slice(-8)}`;
  const networkPassword = randomHotspotPassword();
  const endsAt = new Date(Date.now() + order.hours * 60 * 60 * 1000);
  const network = getNetworkController();

  await network.grantAccess({
    username: networkUser,
    password: networkPassword,
    hours: order.hours,
    mac: order.deviceMac,
  });

  const data: Prisma.SessionUncheckedCreateInput = {
    orderId: order.id,
    planId: order.planId,
    hours: order.hours,
    amountCents: order.amountCents,
    deviceMac: order.deviceMac,
    endsAt,
    networkUser,
    networkPassword,
    source: "ONLINE",
    status: "ACTIVE",
  };
  const session = await prisma.session.create({ data });

  await prisma.auditLog.create({
    data: {
      action: "ACCESS_GRANTED",
      detail: `Pedido ${order.id} · ${order.hours}h · MAC ${order.deviceMac ?? "n/d"}`,
    },
  });

  return session;
}

export async function grantReceptionAccess(input: {
  planId: string;
  deviceMac?: string | null;
}) {
  await expireOverdueSessions();

  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.active) throw new Error("Plano inválido");

  const networkUser = `wifi-rec-${Date.now().toString(36)}`;
  const networkPassword = randomHotspotPassword();
  const endsAt = new Date(Date.now() + plan.hours * 60 * 60 * 1000);
  const network = getNetworkController();

  await network.grantAccess({
    username: networkUser,
    password: networkPassword,
    hours: plan.hours,
    mac: input.deviceMac,
  });

  const data: Prisma.SessionUncheckedCreateInput = {
    planId: plan.id,
    hours: plan.hours,
    amountCents: plan.priceCents,
    deviceMac: input.deviceMac ?? null,
    endsAt,
    networkUser,
    networkPassword,
    source: "RECEPTION",
    status: "ACTIVE",
  };
  const session = await prisma.session.create({ data });

  await prisma.auditLog.create({
    data: {
      action: "ACCESS_GRANTED_RECEPTION",
      detail: `${plan.name} · MAC ${input.deviceMac ?? "n/d"}`,
    },
  });

  return session;
}

export async function revokeSession(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Sessão não encontrada");
  if (session.status !== "ACTIVE") return session;

  const network = getNetworkController();
  await network.revokeAccess({
    username: session.networkUser ?? "",
    mac: session.deviceMac,
  });

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { status: "REVOKED" },
  });

  await prisma.auditLog.create({
    data: {
      action: "ACCESS_REVOKED",
      detail: sessionId,
    },
  });

  return updated;
}

export async function markOrderPaid(orderId: string) {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    include: { session: true },
  });
  if (!current) throw new Error("Pedido não encontrado");

  if (current.status !== "PAID") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  const session = await grantPaidAccess(orderId);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  return { order, session };
}
