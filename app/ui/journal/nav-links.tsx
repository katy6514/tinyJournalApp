"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { name: "About", href: "/journal" },
  { name: "The Map", href: "/journal/map" },
  { name: "The Journal", href: "/journal/listView" },
  { name: "Photo Album", href: "/journal/photoAlbum" },
  { name: "Dev Journal", href: "/journal/devJournal" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
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
