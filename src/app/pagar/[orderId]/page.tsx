import { PayView } from "@/components/PayView";
import { isMockPayments } from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatBRL, formatHours } from "@/lib/money";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { plan: true, session: true },
  });

  if (!order) notFound();
  if (order.status === "PAID") {
    redirect(`/conectado/claim?pedido=${order.id}`);
  }

  const copyPaste = order.pixCopyPaste ?? order.id;
  const qrDataUrl = await QRCode.toDataURL(copyPaste, {
    margin: 1,
    width: 280,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <PayView
      orderId={order.id}
      copyPaste={copyPaste}
      qrDataUrl={qrDataUrl}
      amountLabel={formatBRL(order.amountCents)}
      hoursLabel={formatHours(order.hours)}
      demoMode={isMockPayments}
    />
  );
}
