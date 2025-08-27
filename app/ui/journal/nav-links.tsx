"use client";
import { sourceSans } from "@/app/ui/fonts";

import {
  HomeIcon,
  Bars3BottomLeftIcon,
  CalendarIcon,
  CameraIcon,
  VideoCameraIcon,
  GlobeAmericasIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: "About", href: "/journal", icon: HomeIcon },
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
    href: "/journal/photoAlbum",
    icon: CameraIcon,
  },
  // {
  //   name: "Youtube Uploads",
  //   href: "/videos",
  //   icon: VideoCameraIcon,
  // },
  {
    name: "Dev Journal",
    href: "/journal/devJournal",
    icon: CommandLineIcon,
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
              `flex h-[56px] grow items-center ${sourceSans.className} font-bold justify-center gap-2  bg-gray-50 dark:bg-gray-800 p-3 text-xl hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-end md:p-2 md:px-3`,
              {
                "bg-sky-100 text-blue-600": pathname === link.href,
              }
            )}
            // style={{ fontWeight: 900 }}
          >
            <p className="hidden md:block ">{link.name}</p>
            <LinkIcon className="w-6" />
          </Link>
        );
      })}
    </>
  );
}
