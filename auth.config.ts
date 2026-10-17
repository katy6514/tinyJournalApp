import type { NextAuthConfig } from "next-auth";
import { isAdminEmail, isAdminPath } from "@/app/lib/admin";

export const authConfig = {
  pages: {
    // There's no separate login page: unauthenticated visitors land on the
    // public map, where the login dialog opens because of ?callbackUrl=.
    signIn: "/journal/map",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnJournal = nextUrl.pathname.startsWith("/journal");
      if (isOnJournal) {
        if (!isLoggedIn) return false; // Redirect unauthenticated users to the login dialog
        if (isAdminPath(nextUrl.pathname) && !isAdminEmail(auth.user?.email)) {
          return Response.redirect(new URL("/journal/map", nextUrl));
        }
        return true;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/journal", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
