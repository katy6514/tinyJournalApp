import Link from "next/link";

import { Button } from "@/app/ui/button";
import { updateEntry } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

export default function EditEntryForm({ entry }: { entry: JournalEntry[] }) {
  const { id, date, legname, state, text } = entry[0];
  const updateEntryWithId = updateEntry.bind(null, id);

  return (
    <form action={updateEntryWithId}>
      <div className=" bg-gray-50 p-4 md:p-6">
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <h3 className="text-lg font-semibold">updating {date}</h3>

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
              className="bg-white border border-gray-300 text-gray-900 text-sm  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder={"Enter state"}
              defaultValue={state || ""}
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
              className="bg-white border border-gray-300 text-gray-900 text-sm  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder={"Enter title / LegName"}
              defaultValue={legname || ""}
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
              id="text"
              name="text"
              className="block p-2.5 w-full text-sm text-gray-900 bg-white  border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Write your thoughts here..."
              defaultValue={text || ""}
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
