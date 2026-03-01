"use client";

import {
  HomeIcon,
  Bars3BottomLeftIcon,
  CameraIcon,
  GlobeAmericasIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { name: "About", href: "/journal", icon: HomeIcon },
  { name: "The Map", href: "/journal/map", icon: GlobeAmericasIcon },
  { name: "The Journal", href: "/journal/listView", icon: Bars3BottomLeftIcon },
  { name: "Photo Album", href: "/journal/photoAlbum", icon: CameraIcon },
  { name: "Dev Journal", href: "/journal/devJournal", icon: CommandLineIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <li key={link.name}>
            <Link
              href={link.href}
              className={clsx({ active: pathname === link.href })}
            >
              <LinkIcon className="w-4 h-4" />
              {link.name}
            </Link>
          </li>
        );
      })}
    </>
  );
}
