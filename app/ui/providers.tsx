"use client";

import { SessionProvider } from "next-auth/react";
import LoginDialogProvider from "@/app/ui/login-dialog";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoginDialogProvider>{children}</LoginDialogProvider>
    </SessionProvider>
  );
}
