import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

// Custom middleware to allow /seed without auth
export function middleware(req: NextRequest) {
  // Allow /seed route without authentication
  if (req.nextUrl.pathname.startsWith("/seed")) {
    return NextResponse.next();
  }
  // Otherwise, use NextAuth middleware
  // @ts-expect-error: NextAuth middleware typing is not compatible with NextRequest here
  return NextAuth(authConfig).auth(req);
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
