"use client";
import { sourceSans } from "@/app/ui/fonts";

import { navigationColors } from "@/app/lib/definitions";

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
  {
    name: "About",
    href: "/journal",
    icon: HomeIcon,
    // color: navigationColors.oddDays.mid,
    // colorDark: navigationColors.oddDays.dark,
  },
  {
    name: "The Map",
    href: "/journal/map",
    icon: GlobeAmericasIcon,
    // color: navigationColors.campSites.mid,
    // colorDark: navigationColors.campSites.dark,
  },
  {
    name: "The Journal",
    href: "/journal/listView",
    icon: Bars3BottomLeftIcon,
    // color: navigationColors.messages.mid,
    // colorDark: navigationColors.messages.dark,
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
    // color: navigationColors.evenDays.mid,
    // colorDark: navigationColors.evenDays.dark,
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
    // color: navigationColors.photos.mid,
    // colorDark: navigationColors.photos.dark,
  },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        // console.log(link.color);
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              `flex h-[56px] grow items-center ${sourceSans.className} font-bold justify-center gap-2 bg-gray-50 dark:bg-gray-800 p-3 text-xl hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-end md:p-2 md:px-3`,
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
