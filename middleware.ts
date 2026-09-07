import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

// Custom middleware to allow /seed and the public trail map without auth
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/seed") || pathname.startsWith("/journal/map")) {
    return NextResponse.next();
  }
  // Otherwise, use NextAuth middleware
  // @ts-expect-error: NextAuth middleware typing is not compatible with NextRequest here
  return NextAuth(authConfig).auth(req);
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // matcher: [
  //   "/((?!api|_next/static|_next/image|data|login|CDTphotos|.*\\.png$|$).*)",
  // ],
  matcher: ["/journal/:path*"],
};
