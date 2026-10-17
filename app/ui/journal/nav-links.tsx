"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { isAdminEmail } from "@/app/lib/admin";
import { useLoginDialog } from "@/app/ui/login-dialog";

const links = [
  { name: "About", href: "/journal" },
  { name: "The Map", href: "/journal/map" },
  { name: "The Journal", href: "/journal/listView", requiresLogin: true },
  { name: "Calendar", href: "/journal/calendarView", adminOnly: true },
  { name: "Photo Album", href: "/journal/photoAlbum", adminOnly: true },
  { name: "Dev Journal", href: "/journal/devJournal" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { openLogin } = useLoginDialog();
  const isAdmin = isAdminEmail(session?.user?.email);

  return (
    <>
      {links
        .filter((link) => !link.adminOnly || isAdmin)
        .map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={(event) => {
              // Logged-out visitors get the login dialog instead of a redirect.
              if (link.requiresLogin && status === "unauthenticated") {
                event.preventDefault();
                openLogin(link.href);
              }
            }}
            className={clsx("btn btn-ghost btn-sm", {
              "btn-active": pathname === link.href,
            })}
          >
            {link.name}
          </Link>
        ))}
    </>
  );
}
