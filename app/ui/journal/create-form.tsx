"use client";

import { useActionState } from "react";

import { FormButton } from "@/app/ui/journal/buttons";
import { createEntry, State } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

import { Button } from "../button";

export default function Form({
  emptyEntries,
}: {
  emptyEntries: JournalEntry[];
}) {
  const initialState: State = { message: null, errors: {} };

  const [formState, formAction] = useActionState(createEntry, initialState);

  //   console.log({ emptyEntries });
  return (
    <form action={formAction}>
      <div className=" bg-gray-50 p-4 md:p-6">
        <div className="grid gap-6 mb-6 grid-cols-2 grid-rows-4">
          {/* DATE SELECTION */}
          <div className="col-span-2 md:col-span-1  row-span-1">
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
              aria-describedby="date-error"
              required
            >
              <option value="">Select a date</option>
              {emptyEntries.map((entry) => (
                <option key={entry.date_id} value={entry.date_id}>
                  {entry.date}
                </option>
              ))}
            </select>
            <div id="date-error" aria-live="polite" aria-atomic="true">
              {formState.errors?.date_id &&
                formState.errors.date_id.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* STATE */}
          <div className="col-span-2 md:col-span-1  row-span-1">
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
              aria-describedby="state-error"
              required
            />
            <div id="state-error" aria-live="polite" aria-atomic="true">
              {formState.errors?.state &&
                formState.errors.state.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* LEGNAME */}
          <div className="col-span-2 row-span-1">
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
              aria-describedby="legname-error"
              required
            />
            <div id="legname-error" aria-live="polite" aria-atomic="true">
              {formState.errors?.legname &&
                formState.errors.legname.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* JOURNAL ENTRY */}
          <div className="col-span-2 row-span-2">
            <label
              htmlFor="text"
              className="block mb-2 w-full text-sm font-medium text-gray-900 dark:text-white"
            >
              Journal Entry
            </label>
            <textarea
              id="text"
              name="text"
              className="block p-2.5 w-full h-full text-sm text-gray-900 bg-white  border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Write your thoughts here..."
              aria-describedby="entry-error"
              required
            ></textarea>
            <div id="entry-error" aria-live="polite" aria-atomic="true">
              {formState.errors?.text &&
                formState.errors.text.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button href="/journal/listView" variant="light">
          Cancel
        </Button>
        <FormButton type="submit">Save Entry</FormButton>
      </div>
    </form>
  );
}
