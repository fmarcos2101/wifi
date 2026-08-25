import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function rememberHotspotParams(request: NextRequest, response: NextResponse) {
  const mac =
    request.nextUrl.searchParams.get("mac") ??
    request.nextUrl.searchParams.get("clientmac");
  const login =
    request.nextUrl.searchParams.get("link-login-only") ??
    request.nextUrl.searchParams.get("link-login");

  if (mac) {
    response.cookies.set("wifi_mac", mac.toUpperCase(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  if (login) {
    response.cookies.set("wifi_login", login, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 6,
    });
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!request.cookies.get("admin_session")?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const response = NextResponse.next();
  rememberHotspotParams(request, response);
  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/pagar/:path*", "/conectado/:path*"],
};
