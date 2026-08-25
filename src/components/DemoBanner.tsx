import { networkProvider } from "@/lib/config";

export function DemoBanner() {
  if (networkProvider !== "mock") return null;
  return (
    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950">
      Demo: MikroTik simulado. A internet real deste aparelho não será bloqueada.
    </p>
  );
}
