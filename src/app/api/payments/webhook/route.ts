import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/access";

const bodySchema = z
  .object({
    paymentRef: z.string().min(1).optional(),
    orderId: z.string().min(1).optional(),
    status: z.enum(["paid", "PAID"]),
  })
  .refine((data) => Boolean(data.paymentRef || data.orderId));

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { paymentRef, orderId, status } = parsed.data;
  if (status !== "paid" && status !== "PAID") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const order = await prisma.order.findFirst({
    where: paymentRef ? { paymentRef } : { id: orderId },
  });

  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true, orderId: order.id });
  }

  const result = await markOrderPaid(order.id);
  return NextResponse.json({
    ok: true,
    orderId: result.order.id,
    sessionId: result.session.id,
    endsAt: result.session.endsAt,
  });
}
