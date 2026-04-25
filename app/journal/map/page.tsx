import Link from "next/link";
import CDTmap from "./CDTmap";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  return (
    <main className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
      <CDTmap />
      {session && (
        <div className="flex justify-end gap-4 px-4 py-2">
          <Link
            href="/uploadTrack"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Upload Track Data
          </Link>
          <Link
            href="/uploadPhotos"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Upload Photos
          </Link>
        </div>
      )}
      <div
        id="tooltip"
        role="tooltip"
        className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-xs opacity-0 tooltip dark:bg-gray-700"
      ></div>
    </main>
  );
}
