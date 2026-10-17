"use client";

import Image from "next/image";
import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import LoginForm from "@/app/ui/login-form";
import titcombBasin from "@/public/titcombBasin.jpg";

type LoginDialogContextValue = {
  // Opens the login dialog; after a successful login the browser goes to callbackUrl.
  openLogin: (callbackUrl?: string) => void;
};

const LoginDialogContext = createContext<LoginDialogContextValue>({
  openLogin: () => {},
});

export const useLoginDialog = () => useContext(LoginDialogContext);

// Only allow same-origin redirects after login, and strip the origin.
function safeCallbackUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return undefined;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return undefined;
  }
}

// Middleware sends logged-out visitors of protected pages to /journal/map?callbackUrl=...
// Open the dialog automatically when that happens, then clear the param.
function OpenFromSearchParams({ openLogin }: { openLogin: (callbackUrl?: string) => void }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    if (!callbackUrl || status !== "unauthenticated") return;
    openLogin(callbackUrl);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("callbackUrl");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [callbackUrl, status, openLogin, pathname, router, searchParams]);

  return null;
}

export default function LoginDialogProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>();
  // Bumped on every open so the form remounts with empty fields and no stale error.
  const [formKey, setFormKey] = useState(0);

  const openLogin = useCallback((url?: string) => {
    setCallbackUrl(safeCallbackUrl(url));
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }, []);

  return (
    <LoginDialogContext.Provider value={{ openLogin }}>
      {children}
      <Suspense>
        <OpenFromSearchParams openLogin={openLogin} />
      </Suspense>
      <dialog ref={dialogRef} className="modal" aria-label="Log in">
        <div className="modal-box p-0 flex overflow-hidden w-[calc(100vw-2rem)] max-w-none md:w-[50vw] md:h-[50vh] md:min-h-[26rem]">
          <div className="relative hidden md:block basis-2/5 flex-shrink-0">
            <Image
              src={titcombBasin}
              alt="Titcomb Basin in the Wind River Range"
              fill
              sizes="20vw"
              className="object-cover"
            />
          </div>
          <div className="relative flex-1 overflow-y-auto flex items-center">
            <form method="dialog" className="absolute right-2 top-2">
              <button className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </form>
            <div className="w-full max-w-[400px] mx-auto p-4">
              <LoginForm key={formKey} callbackUrl={callbackUrl} />
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close">close</button>
        </form>
      </dialog>
    </LoginDialogContext.Provider>
  );
}
