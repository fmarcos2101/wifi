"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { grantReceptionAccess, revokeSession } from "@/lib/access";
import {
  clearAdminCookie,
  isAdminAuthenticated,
  passwordMatches,
  setAdminCookie,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    redirect("/admin/login?erro=1");
  }
  await setAdminCookie();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminCookie();
  redirect("/admin/login");
}

export async function revokeAccessAction(formData: FormData) {
  await requireAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");
  await revokeSession(sessionId);
  revalidatePath("/admin");
}

export async function grantReceptionAction(formData: FormData) {
  await requireAdmin();
  const planId = String(formData.get("planId") ?? "");
  const deviceMac = String(formData.get("deviceMac") ?? "").trim() || null;
  await grantReceptionAccess({ planId, deviceMac });
  revalidatePath("/admin");
}

export async function updatePlanPriceAction(formData: FormData) {
  await requireAdmin();
  const planId = String(formData.get("planId") ?? "");
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Valor inválido");
  }
  await prisma.plan.update({
    where: { id: planId },
    data: { priceCents: Math.round(price * 100) },
  });
  revalidatePath("/admin");
}
