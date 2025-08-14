import Link from "next/link";

import { Button } from "@/app/ui/button";
import { createEntry } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

export default function Form({
  emptyEntries,
}: {
  emptyEntries: JournalEntry[];
}) {
  //   console.log({ emptyEntries });
  return (
    <form action={createEntry}>
      <div className=" bg-gray-50 p-4 md:p-6">
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* DATE SELECTION */}
          <div>
            <label
              htmlFor="date"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Select an empty date
            </label>
            <select
              id="date"
              name="date_id"
              className="bg-white border border-gray-300 text-gray-900 text-sm  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            >
              <option value="" disabled>
                Select a date
              </option>
              {emptyEntries.map((entry) => (
                <option key={entry.date_id} value={entry.date_id}>
                  {entry.date}
                </option>
              ))}
            </select>
          </div>

          {/* STATE */}
          <div>
            <label
              htmlFor="state"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              State
            </label>
            <input
              id="state"
              name="state"
              type="text"
              placeholder="NM/CO/WY/ID/MT"
              className="bg-white border border-gray-300 text-gray-900 text-sm  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
          </div>

          {/* LEGNAME */}
          <div className="mb-6">
            <label
              htmlFor="legname"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LegName
            </label>
            <input
              type="text"
              id="legname"
              name="legname"
              className="bg-white border border-gray-300 text-gray-900 text-sm  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Title"
              required
            />
          </div>

          {/* JOURNAL ENTRY */}
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
              className="block p-2.5 w-full text-sm text-gray-900 bg-white  border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Write your thoughts here..."
              required
            ></textarea>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/journal/listView"
          className="flex h-10 items-center  bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Save Entry</Button>
      </div>
    </form>
  );
}
