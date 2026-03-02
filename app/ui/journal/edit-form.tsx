"use client";

import { useActionState } from "react";

import { Button } from "../components/button";

import { updateEntry, EditState } from "@/app/lib/actions";
import { JournalEntry, StateOption } from "@/app/lib/definitions";
import { Select, Input, TextArea, Label } from "../components/inputs";

export default function EditEntryForm({
  entry,
  states,
}: {
  entry: JournalEntry;
  states: StateOption[];
}) {
  const { entry_id, date, legname, state_id, text } = entry;
  const updateEntryWithId = updateEntry.bind(null, entry_id);

  const initialState: EditState = { message: null, errors: {} };

  const [formState, formAction] = useActionState(
    updateEntryWithId,
    initialState
  );

  return (
    <form action={formAction}>
      <div className=" bg-gray-50 p-4 md:p-6">
        <div className="grid gap-6 mb-6 grid-cols-2 grid-rows-4">
          <div className="col-span-2 md:col-span-1  row-span-1">
            <h3 className="text-lg font-semibold">updating {date}</h3>
          </div>

          {/* STATE */}
          <div className="col-span-2 md:col-span-1  row-span-1">
            <Label htmlFor="state_id">State</Label>
            <Select
              id="state_id"
              name="state_id"
              aria-describedby="state-error"
              required
              defaultValue={state_id || ""}
            >
              <option value="">Select a state</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <div id="state-error" aria-live="polite" aria-atomic="true">
              {formState.errors?.state_id &&
                formState.errors.state_id.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* LEGNAME */}
          <div className="col-span-2 row-span-1">
            <Label htmlFor="legname">Title / LegName</Label>
            <Input
              type="text"
              id="legname"
              name="legname"
              placeholder={"Title"}
              defaultValue={legname || ""}
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

          {/* Journal Entry */}
          <div className="col-span-2 row-span-2">
            <Label htmlFor="text">Journal Entry</Label>
            <TextArea
              id="text"
              name="text"
              placeholder="Write your thoughts here..."
              defaultValue={text || ""}
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
        <Button href={`/journal/${entry_id}`} variant="secondary">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Entry
        </Button>
      </div>
    </form>
  );
}
