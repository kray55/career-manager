// ──────────────────────────────────────────────
// Next.js Middleware (T12-A)
// Captures ?ref= query param from incoming requests
// and stores it as a cookie for affiliate tracking.
// ──────────────────────────────────────────────
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const ref = url.searchParams.get("ref");

  if (ref) {
    // Strip ref from the URL so it doesn't persist in browser
    url.searchParams.delete("ref");

    const response = NextResponse.redirect(url);
    // Set a cookie that persists for 30 days
    response.cookies.set("affiliate_ref", ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (we handle ref in the checkout action)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
