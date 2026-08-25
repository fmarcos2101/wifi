"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDeviceMac, normalizeMac, rememberDeviceMac, rememberHotspotLogin } from "@/lib/device";
import { getPaymentProvider } from "@/lib/payments";
import { expireOverdueSessions } from "@/lib/access";

export async function startCheckout(formData: FormData) {
  await expireOverdueSessions();

  const planId = String(formData.get("planId") ?? "");
  const plan = await prisma.plan.findFirst({
    where: { id: planId, active: true },
  });
  if (!plan) throw new Error("Escolha um tempo válido");

  const deviceMac =
    normalizeMac(String(formData.get("mac") ?? "")) ?? (await getDeviceMac());
  await rememberDeviceMac(deviceMac);
  await rememberHotspotLogin(String(formData.get("login") ?? "").trim() || null);
  const order = await prisma.order.create({
    data: {
      planId: plan.id,
      hours: plan.hours,
      amountCents: plan.priceCents,
      deviceMac,
      status: "PENDING",
    },
  });

  const charge = await getPaymentProvider().createPixCharge({
    orderId: order.id,
    amountCents: order.amountCents,
    description: `Wi-Fi ${plan.name}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentRef: charge.paymentRef,
      pixCopyPaste: charge.copyPaste,
    },
  });

  redirect(`/pagar/${order.id}`);
}
