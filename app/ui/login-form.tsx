"use client";
import { sourceSans } from "@/app/ui/fonts";

import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/components/button";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setIsPending(true);
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
      if (!result || result.error) {
        setErrorMessage(
          result?.error === "CredentialsSignin"
            ? "Invalid credentials."
            : "Something went wrong."
        );
        setIsPending(false);
        return;
      }
      // Full page load so server-rendered pages and client-fetched data
      // (like full entry text on the map) pick up the new session.
      window.location.assign(callbackUrl ?? window.location.href);
    } catch {
      setErrorMessage("Something went wrong.");
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${sourceSans.className}`}>
      <div className="flex-1 bg-gray-50 dark:bg-gray-800 px-6 pb-4 pt-8">
        <h1 className={`${sourceSans.className} mb-3 text-2xl`}>
          Please log in to continue.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-sm font-medium text-gray-900 dark:text-gray-50"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:peer-focus:text-gray-50" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-sm font-medium text-gray-900 dark:text-gray-50"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                autoComplete="current-password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900  dark:peer-focus:text-gray-50" />
            </div>
          </div>
        </div>
        <Button className="mt-4 w-full" type="submit" variant="outline">
          {isPending ? "Logging in…" : "Log in"}
        </Button>
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
