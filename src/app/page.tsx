import { startCheckout } from "@/app/actions/checkout";
import { expireOverdueSessions, getActiveSessionById } from "@/lib/access";
import { DemoBanner } from "@/components/DemoBanner";
import { hotelName } from "@/lib/config";
import { prisma } from "@/lib/db";
import { getGuestSessionId, normalizeMac } from "@/lib/device";
import { formatBRL, formatHours } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    mac?: string;
    "link-login-only"?: string;
    "link-login"?: string;
  }>;
}) {
  await expireOverdueSessions();

  const sessionId = await getGuestSessionId();
  if (sessionId) {
    const session = await getActiveSessionById(sessionId);
    if (session) redirect("/conectado");
  }

  const params = await searchParams;
  const deviceMac = normalizeMac(params.mac) ?? "";
  const login = params["link-login-only"] ?? params["link-login"] ?? "";
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <DemoBanner />
      <p className="mt-6 text-sm font-medium text-slate-500">{hotelName}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Quanto tempo você precisa?
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Escolha, pague e a internet libera neste aparelho.
      </p>

      <div className="mt-8 grid gap-3">
        {plans.map((plan) => (
          <form action={startCheckout} key={plan.id}>
            <input type="hidden" name="planId" value={plan.id} />
            {deviceMac ? <input type="hidden" name="mac" value={deviceMac} /> : null}
            {login ? <input type="hidden" name="login" value={login} /> : null}
            <button
              type="submit"
              className="flex h-[4.5rem] w-full items-center justify-between rounded-2xl bg-white px-5 text-left shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99]"
            >
              <span className="text-lg font-semibold">{formatHours(plan.hours)}</span>
              <span className="text-lg font-medium text-slate-700">
                {formatBRL(plan.priceCents)}
              </span>
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
