import Link from "next/link";
import NavLinks from "@/app/ui/journal/nav-links";
import AuthButton from "@/app/ui/journal/auth-button";

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
        <AuthButton />
      </div>
    </div>
  );
}
