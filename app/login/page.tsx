import { redirect } from "next/navigation";

// Login now happens in a dialog over the app. Keep /login working for old
// links by sending visitors to the map, which opens the dialog.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  redirect(
    `/journal/map?callbackUrl=${encodeURIComponent(callbackUrl || "/journal")}`
  );
}
