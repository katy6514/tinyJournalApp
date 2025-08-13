// import { CustomerField } from "@/app/lib/definitions";
import Link from "next/link";
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";
import { createEntry } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

export default function Form({
  emptyEntries,
}: {
  emptyEntries: JournalEntry[];
}) {
  //   console.log("its the create entry form!");
  return (
    <form action={createEntry}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Name */}
        <div className="mb-4">
          <label htmlFor="emptyDate" className="mb-2 block text-sm font-medium">
            Choose a date for the entry
          </label>
          <div className="relative">
            <select
              id="emptyDate"
              name="customerId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 p-2.5 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
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
          </div>
        </div>

        {/* State */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Choose a state
          </label>
          <div className="relative mt-2  rounded-md">
            <div className="relative">
              <input
                id="state"
                name="state"
                type="string"
                placeholder="Enter state"
                className="peer block w-full rounded-md border border-gray-200 py-2 p-2.5 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Title / LegName */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Title / LegName
          </label>
          <div className="relative mt-2  rounded-md">
            <div className="relative">
              <input
                id="state"
                name="state"
                type="string"
                placeholder="Enter state"
                className="peer block w-full rounded-md border border-gray-200 py-2 p-2.5 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Entry text */}
        <div className="mb-4">
          <label
            htmlFor="entryText"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your message
          </label>

          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <textarea
                id="entryText"
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Write your thoughts here..."
              ></textarea>
            </div>
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
