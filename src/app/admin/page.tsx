import {
  adminLogout,
  grantReceptionAction,
  revokeAccessAction,
  updatePlanPriceAction,
} from "@/app/actions/admin";
import { expireOverdueSessions } from "@/lib/access";
import { isAdminAuthenticated } from "@/lib/auth";
import { hotelName } from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatBRL, formatHours, formatRemaining, startOfToday } from "@/lib/money";
import { networkLabel } from "@/lib/network";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  await expireOverdueSessions();
  const today = startOfToday();

  const [activeSessions, paidToday, plans, recentPaid] = await Promise.all([
    prisma.session.findMany({
      where: { status: "ACTIVE", endsAt: { gt: new Date() } },
      include: { plan: true },
      orderBy: { endsAt: "asc" },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: today } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.order.findMany({
      where: { status: "PAID" },
      include: { plan: true },
      orderBy: { paidAt: "desc" },
      take: 8,
    }),
  ]);

  const revenueCents = paidToday._sum.amountCents ?? 0;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{hotelName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Acessos</h1>
          <p className="mt-1 text-xs text-slate-500">Rede: {networkLabel()}</p>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="text-sm text-slate-500 hover:text-slate-800">
            Sair
          </button>
        </form>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Online agora" value={String(activeSessions.length)} />
        <Stat label="Pagamentos hoje" value={String(paidToday._count)} />
        <Stat label="Valor hoje" value={formatBRL(revenueCents)} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Quem está online</h2>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {activeSessions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Ninguém conectado no momento
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatHours(session.hours)}
                      {session.source === "RECEPTION" ? " · recepção" : ""}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {session.deviceMac ?? "aparelho sem MAC"} · resta{" "}
                      {formatRemaining(session.endsAt)}
                    </p>
                  </div>
                  <form action={revokeAccessAction}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Encerrar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Liberar na recepção</h2>
        <p className="mt-1 text-sm text-slate-500">
          Para pagamento em dinheiro, no cartão da recepção ou cortesia.
        </p>
        <form
          action={grantReceptionAction}
          className="mt-3 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-[1fr_1fr_auto]"
        >
          <select
            name="planId"
            required
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            defaultValue={plans[0]?.id}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {formatHours(plan.hours)} · {formatBRL(plan.priceCents)}
              </option>
            ))}
          </select>
          <input
            name="deviceMac"
            placeholder="MAC (opcional)"
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white"
          >
            Liberar
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Preços</h2>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <ul className="divide-y divide-slate-100">
            {plans.map((plan) => (
              <li key={plan.id} className="px-4 py-3">
                <form
                  action={updatePlanPriceAction}
                  className="flex items-center justify-between gap-3"
                >
                  <p className="text-sm font-medium">{formatHours(plan.hours)}</p>
                  <div className="flex items-center gap-2">
                    <input type="hidden" name="planId" value={plan.id} />
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={(plan.priceCents / 100).toFixed(2)}
                      className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-right text-sm"
                    />
                    <button
                      type="submit"
                      className="h-10 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 pb-10">
        <h2 className="text-lg font-semibold">Últimos pagamentos</h2>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {recentPaid.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhum pagamento ainda
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPaid.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span>
                    {formatHours(order.hours)}
                    <span className="text-slate-400">
                      {" "}
                      ·{" "}
                      {order.paidAt
                        ? order.paidAt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </span>
                  <span className="font-medium">{formatBRL(order.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
