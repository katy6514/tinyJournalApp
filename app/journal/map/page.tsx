import Link from "next/link";
import CDTmap from "./CDTmap";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  return (
    <main className="-m-6 md:-m-12 h-full overflow-hidden relative bg-gray-50 dark:bg-gray-800">
      <CDTmap />
      {session && (
        <div className="absolute bottom-3 right-3 z-20 flex gap-4 px-4 py-2">
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
