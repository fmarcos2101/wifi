import Link from "next/link";
import { DemoBanner } from "@/components/DemoBanner";
import { hotelName } from "@/lib/config";

export default function SimularPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <DemoBanner />
      <p className="mt-6 text-sm font-medium text-slate-500">{hotelName}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Wi-Fi conectado, sem internet
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Assim o MikroTik se comporta: o aparelho entra na rede, mas só libera a
        navegação depois do pagamento.
      </p>
      <Link
        href="/?mac=AA:BB:CC:00:00:01"
        className="mt-8 flex h-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-medium text-white"
      >
        Abrir portal
      </Link>
    </main>
  );
}
