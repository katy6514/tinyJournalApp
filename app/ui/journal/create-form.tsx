"use client";

import { useActionState, useState } from "react";

import { createEntry, State } from "@/app/lib/actions";
import { JournalEntry } from "@/app/lib/definitions";

import { Button } from "../components/button";

import { Select, Input, TextArea, Label } from "../components/inputs";

export default function Form({
  emptyEntries,
  legNameByDateId,
  returnPage,
}: {
  emptyEntries: JournalEntry[];
  legNameByDateId: Record<string, string>;
  returnPage: string;
}) {
  const initialState: State = { message: null, errors: {} };

  const [formState, formAction] = useActionState(createEntry, initialState);
  const [legname, setLegname] = useState("");

  return (
    <form action={formAction}>
      <input type="hidden" name="returnPage" value={returnPage} />
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
              onChange={(e) => setLegname(legNameByDateId[e.target.value] ?? "")}
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
            <Select
              id="state"
              name="state"
              aria-describedby="state-error"
              required
            >
              <option value="">Select a state</option>
              <option value="Montana">Montana</option>
              <option value="Idaho">Idaho</option>
              <option value="Wyoming">Wyoming</option>
              <option value="Colorado">Colorado</option>
              <option value="New Mexico">New Mexico</option>
            </Select>
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
              value={legname}
              onChange={(e) => setLegname(e.target.value)}
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
        <Button href="/journal/listView" variant="secondary">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Entry
        </Button>
      </div>
    </form>
  );
}
