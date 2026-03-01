"use client";

import { usePathname } from "next/navigation";
import Search from "@/app/ui/search";

export default function NavbarSearch() {
  const pathname = usePathname();
  if (!pathname.startsWith("/journal/listView")) return null;
  return <Search placeholder="Search entries..." />;
}
