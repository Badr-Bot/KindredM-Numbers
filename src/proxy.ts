import { NextRequest, NextResponse } from "next/server";

// §2 — auth : proxy basic-auth avec DASHBOARD_PASSWORD (env var). Tout le
// site est derrière, y compris l'API cron (protégée en plus par CRON_SECRET).
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  if (!expectedPassword) {
    return new NextResponse("DASHBOARD_PASSWORD n'est pas configuré.", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const password = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
    if (password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentification requise.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="NIVA Dashboard"' },
  });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
