import Link from "next/link";
import NavLinks from "@/app/ui/journal/nav-links";
import { PowerIcon } from "@heroicons/react/24/outline";
import { signOut } from "@/auth";

export default function Navigation() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">
          My CDT Journal
        </Link>
      </div>
      <div className="navbar-center flex gap-1">
        <NavLinks />
      </div>
      <div className="navbar-end gap-2">
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
