"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRemaining } from "@/lib/money";

type Props = {
  sessionId: string;
  hoursLabel: string;
  endsAt: string;
  loginHref?: string | null;
};

export function ConnectedView({ sessionId, hoursLabel, endsAt, loginHref }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState(() => formatRemaining(new Date(endsAt)));

  useEffect(() => {
    const tick = () => setLabel(formatRemaining(new Date(endsAt)));
    tick();
    const clock = setInterval(tick, 1000);

    const poll = setInterval(async () => {
      const response = await fetch(`/api/sessions/${sessionId}/status`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { status?: string };
      if (data.status !== "ACTIVE") {
        router.replace("/");
      }
    }, 5000);

    return () => {
      clearInterval(clock);
      clearInterval(poll);
    };
  }, [endsAt, sessionId, router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
          <path
            d="M5 12.5 9.5 17 19 7.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Você está online</h1>
      <p className="mt-2 text-sm text-slate-600">{hoursLabel} liberadas neste aparelho</p>
      <p className="mt-8 text-5xl font-semibold tabular-nums tracking-tight">{label}</p>
      <p className="mt-2 text-sm text-slate-500">restantes</p>
      {loginHref ? (
        <a
          href={loginHref}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-medium text-white"
        >
          Liberar internet
        </a>
      ) : null}
    </main>
  );
}
