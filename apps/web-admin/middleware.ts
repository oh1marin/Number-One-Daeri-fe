import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasAdminSessionCookie,
  isAuthPublicPath,
  isStaticOrInternalPath,
  shouldSkipAuthMiddleware,
} from "@/lib/adminAuthMiddleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrInternalPath(pathname)) {
    return NextResponse.next();
  }

  if (shouldSkipAuthMiddleware()) {
    return NextResponse.next();
  }

  const hasSession = hasAdminSessionCookie(request);

  if (isAuthPublicPath(pathname)) {
    if (hasSession && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?)$).*)",
  ],
};
