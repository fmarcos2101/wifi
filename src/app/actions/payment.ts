"use server";

import { redirect } from "next/navigation";
import { isMockPayments } from "@/lib/config";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/access";
import { setGuestSessionCookie } from "@/lib/device";

export async function simulatePayment(formData: FormData) {
  if (!isMockPayments) {
    throw new Error("Simulação disponível só no modo demo");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Pedido não encontrado");

  const { session } = await markOrderPaid(order.id);
  await setGuestSessionCookie(session.id, session.endsAt);
  redirect("/conectado");
}
