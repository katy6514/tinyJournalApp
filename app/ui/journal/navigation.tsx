import Link from "next/link";
import NavLinks from "@/app/ui/journal/nav-links";
import NavbarSearch from "@/app/ui/journal/navbar-search";
import { PowerIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { signOut } from "@/auth";

export default function Navigation() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <Bars3Icon className="h-5 w-5" />
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <NavLinks />
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          My CDT Journal
        </Link>
      </div>
      <div className="navbar-center hidden md:flex gap-1">
        <Link href="/journal/map" className="btn btn-ghost btn-sm">
          The Map
        </Link>
        <Link href="/journal/listView" className="btn btn-ghost btn-sm">
          The Journal
        </Link>
      </div>
      <div className="navbar-end gap-2">
        <NavbarSearch />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="btn btn-ghost btn-circle">
            <PowerIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
