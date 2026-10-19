// Admin-level users can see pages that are hidden from everyone else.
// Kept free of server-only imports so it works in middleware and client components.
const ADMIN_EMAILS = ["katy6514@gmail.com"];

export const ADMIN_PATHS = [
  "/journal/calendarView",
  "/journal/photoAlbum",
  "/uploadPhotos",
  "/uploadTrack",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
