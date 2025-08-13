// import { CustomerField } from "@/app/lib/definitions";
import Link from "next/link";
// import {
//   CheckIcon,
//   ClockIcon,
//   CurrencyDollarIcon,
//   UserCircleIcon,
// } from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";
import { createEntry } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

export default function Form({ entry }: { entry: JournalEntry[] }) {
  console.log({ entry });
  return (
    <form action={createEntry}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* Select an empty date */}
          {/* <div>
            <label
              htmlFor="date"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Select an date
            </label>
            <select
              id="date"
              name="date_id"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="" disabled>
                Select a date
              </option>
              {emptyEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.date}
                </option>
              ))}
            </select>
          </div> */}

          {/* Select a state */}
          <div>
            <label
              htmlFor="state"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder={"Enter state"}
              defaultValue={entry[0]?.state || ""}
              required
            />
          </div>

          {/* Title / Legname */}
          <div className="mb-6">
            <label
              htmlFor="legname"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Title / LegName
            </label>
            <input
              type="text"
              id="legname"
              name="legname"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder={"Enter title / LegName"}
              defaultValue={entry[0]?.legname || ""}
              required
            />
          </div>

          {/* Journal Entry */}
          <div className="mb-6">
            <label
              htmlFor="entryText"
              className="block mb-2 w-full text-sm font-medium text-gray-900 dark:text-white"
            >
              Journal Entry
            </label>
            <textarea
              id="entryText"
              name="entryText"
              className="block p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Write your thoughts here..."
              defaultValue={entry[0]?.text || ""}
            ></textarea>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/journal/listView"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Save Entry</Button>
      </div>
    </form>
  );
}
