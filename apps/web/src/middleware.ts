import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@workshop/auth/config";

const { auth } = NextAuth(authConfig);

// Edge auth gate: ensures a session exists for app routes and forwards the
// current pathname so the server layout can run the fine-grained permission
// check (which needs DB access and therefore runs in the Node runtime).
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  const isAuthRoute = path === "/login";
  const isPublicAsset = path === "/" ;

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (isPublicAsset) return NextResponse.redirect(new URL("/dashboard", nextUrl));

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  return NextResponse.next({ request: { headers } });
});

export const config = {
  // Run on everything except Next internals, static files and API routes
  // (tRPC/auth handle their own authorization).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
