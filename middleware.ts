import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

// Public pages under /journal: About, the trail map, and the Dev Journal.
// Everything else (entries, list/calendar views, create/edit) requires login.
const PUBLIC_JOURNAL_PATHS = ["/journal", "/journal/map", "/journal/devJournal"];
const isPublicJournalPath = (pathname: string) =>
  PUBLIC_JOURNAL_PATHS.includes(pathname.replace(/\/$/, ""));

// Custom middleware to allow the public journal pages without auth
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicJournalPath(pathname)) {
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
  matcher: ["/journal/:path*", "/uploadPhotos/:path*", "/uploadTrack/:path*"],
};
