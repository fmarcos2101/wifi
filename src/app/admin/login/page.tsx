import { adminLogin } from "@/app/actions/admin";
import { isAdminAuthenticated } from "@/lib/auth";
import { hotelName } from "@/lib/config";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5">
      <p className="text-sm text-slate-500">{hotelName}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Painel</h1>
      <form action={adminLogin} className="mt-8">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-slate-400"
        />
        {erro ? (
          <p className="mt-2 text-sm text-red-600">Senha incorreta</p>
        ) : null}
        <button
          type="submit"
          className="mt-4 h-12 w-full rounded-2xl bg-slate-900 text-sm font-medium text-white"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
