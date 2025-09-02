"use client";

import { useActionState } from "react";

import { createEntry, State } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

import { Button } from "../components/button";

import { Select, Input, TextArea, Label } from "../components/inputs";

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
            <Label htmlFor="date">Select an empty date</Label>
            <Select
              id="date"
              name="date_id"
              aria-describedby="date-error"
              required
            >
              <option value="">Select a date</option>
              {emptyEntries.map((entry) => (
                <option key={entry.date_id} value={entry.date_id}>
                  {entry.date}
                </option>
              ))}
            </Select>
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
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              type="text"
              placeholder="NM/CO/WY/ID/MT"
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
            <Label htmlFor="legname">LegName</Label>
            <Input
              type="text"
              id="legname"
              name="legname"
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
            <Label htmlFor="text">Journal Entry</Label>
            <TextArea
              id="text"
              name="text"
              placeholder="Write your thoughts here..."
              aria-describedby="entry-error"
              required
            ></TextArea>
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
        <Button type="submit">Save Entry</Button>
      </div>
    </form>
  );
}
