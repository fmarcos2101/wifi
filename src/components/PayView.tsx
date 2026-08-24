"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  copyPaste: string;
  qrDataUrl: string;
  amountLabel: string;
  hoursLabel: string;
  demoMode: boolean;
};

export function PayView({
  orderId,
  copyPaste,
  qrDataUrl,
  amountLabel,
  hoursLabel,
  demoMode,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { status?: string };
      if (data.status === "PAID") {
        router.replace(`/conectado/claim?pedido=${orderId}`);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId, router]);

  async function copyPix() {
    await navigator.clipboard.writeText(copyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function confirmDemoPayment() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, status: "paid" }),
      });
      if (!response.ok) {
        throw new Error("fail");
      }
      router.replace(`/conectado/claim?pedido=${orderId}`);
    } catch {
      setError("Não deu para confirmar. Tente de novo.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <p className="text-sm text-slate-500">Pagamento</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {hoursLabel} · {amountLabel}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Pague no PIX. Assim que a API confirmar, a rede libera sozinha.
      </p>

      <div className="mt-8 flex flex-col items-center rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR Code PIX"
          className="h-52 w-52 rounded-xl bg-white"
        />
        <p className="mt-4 text-sm font-medium text-slate-700">
          Aguardando pagamento…
        </p>
        <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-900" />
        </div>
      </div>

      <button
        type="button"
        onClick={copyPix}
        className="mt-4 h-12 rounded-2xl bg-slate-900 text-sm font-medium text-white"
      >
        {copied ? "Código copiado" : "Copiar código PIX"}
      </button>

      {demoMode ? (
        <button
          type="button"
          onClick={confirmDemoPayment}
          disabled={busy}
          className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-60"
        >
          {busy ? "Liberando…" : "Simular pagamento"}
        </button>
      ) : null}

      {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}

      <Link
        href="/"
        className="mt-8 text-center text-sm text-slate-500 underline-offset-4 hover:underline"
      >
        Escolher outro tempo
      </Link>
    </main>
  );
}
