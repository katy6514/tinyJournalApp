import { auth } from "@/auth";
import { isAdminEmail } from "@/app/lib/admin";

// Server Actions and route handlers can be called directly over the network,
// so middleware alone doesn't protect them. Call this first in anything that
// changes data.
export async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("Not authorized");
  }
  return session;
}
