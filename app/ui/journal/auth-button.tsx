"use client";

import { signOut, useSession } from "next-auth/react";
import { useLoginDialog } from "@/app/ui/login-dialog";

export default function AuthButton() {
  const { status } = useSession();
  const { openLogin } = useLoginDialog();

  // Avoid flashing the wrong label while the session loads.
  if (status === "loading") {
    return <span className="btn btn-ghost btn-sm invisible">Sign in</span>;
  }

  if (status === "authenticated") {
    return (
      <button className="btn btn-ghost btn-sm" onClick={() => signOut({ redirectTo: "/" })}>
        Sign out
      </button>
    );
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={() => openLogin()}>
      Sign in
    </button>
  );
}
