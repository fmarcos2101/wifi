import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionById } from "@/lib/access";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/device";

export async function GET(request: NextRequest) {
  const pedido = request.nextUrl.searchParams.get("pedido");
  if (!pedido) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const order = await prisma.order.findUnique({
    where: { id: pedido },
    include: { session: true },
  });

  const session = order?.session
    ? await getActiveSessionById(order.session.id)
    : null;

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.redirect(new URL("/conectado", request.url));
  response.cookies.set(
    SESSION_COOKIE,
    session.id,
    sessionCookieOptions(session.endsAt),
  );
  return response;
}
