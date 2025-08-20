"use client";
import { sourceSans } from "@/app/ui/fonts";

import {
  HomeIcon,
  Bars3BottomLeftIcon,
  CalendarIcon,
  CameraIcon,
  VideoCameraIcon,
  GlobeAmericasIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: "Home", href: "/journal", icon: HomeIcon },
  {
    name: "The Map",
    href: "/journal/map",
    icon: GlobeAmericasIcon,
  },
  {
    name: "The Journal",
    href: "/journal/listView",
    icon: Bars3BottomLeftIcon,
  },
  // {
  //   name: "Calendar View",
  //   href: "/journal/calendarView",
  //   icon: CalendarIcon,
  // },
  {
    name: "Photo Album",
    href: "/photos",
    icon: CameraIcon,
  },
  {
    name: "Youtube Uploads",
    href: "/videos",
    icon: VideoCameraIcon,
  },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              `flex h-[48px] grow items-center ${sourceSans.className} justify-center gap-2  bg-gray-50 dark:bg-gray-800 p-3 text-md font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3`,
              {
                "bg-sky-100 text-blue-600": pathname === link.href,
              }
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block ">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
