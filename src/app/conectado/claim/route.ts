import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionById } from "@/lib/access";
import { isMikrotikEnabled } from "@/lib/network";
import { buildHotspotLoginUrl } from "@/lib/network/hotspot";
import { LOGIN_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/lib/device";

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

  const connected = new URL("/conectado", request.url);
  const loginBase =
    request.cookies.get(LOGIN_COOKIE)?.value ??
    process.env.MIKROTIK_LOGIN_URL?.trim() ??
    null;
  const hotspotLogin =
    isMikrotikEnabled() && session.networkUser && session.networkPassword
      ? buildHotspotLoginUrl({
          loginBase,
          username: session.networkUser,
          password: session.networkPassword,
          dst: connected.toString(),
        })
      : null;

  const response = NextResponse.redirect(hotspotLogin ?? connected.toString());
  response.cookies.set(
    SESSION_COOKIE,
    session.id,
    sessionCookieOptions(session.endsAt),
  );
  return response;
}
