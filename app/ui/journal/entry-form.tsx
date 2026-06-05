"use client";

import { useActionState, useState } from "react";

import { createEntry, updateEntry, State } from "@/app/lib/actions/entries";
import { JournalEntry, StateOption } from "@/app/lib/definitions";

import { Button } from "../components/button";
import { Select, Input, TextArea } from "../components/inputs";

type CreateProps = {
  entry?: undefined;
  emptyEntries: JournalEntry[];
  legNameByDateId: Record<string, string>;
  returnPage: string;
  states: StateOption[];
};

type EditProps = {
  entry: JournalEntry;
  emptyEntries?: undefined;
  legNameByDateId?: undefined;
  returnPage?: undefined;
  states: StateOption[];
};

type Props = CreateProps | EditProps;

const initialState: State = { message: null, errors: {} };

export default function EntryForm({
  entry,
  emptyEntries,
  legNameByDateId,
  returnPage,
  states,
}: Props) {
  const isEdit = entry !== undefined;

  const action = isEdit
    ? updateEntry.bind(null, entry.entry_id)
    : createEntry;

  const [formState, formAction] = useActionState(
    action as (state: State, formData: FormData) => Promise<State>,
    initialState,
  );
  const [legname, setLegname] = useState(entry?.legname ?? "");

  return (
    <form action={formAction}>
      {!isEdit && (
        <input type="hidden" name="returnPage" value={returnPage} />
      )}
      <div className="card bg-base-100 dark:bg-gray-700 shadow-sm">
        <div className="card-body">
          <div className="grid gap-5 grid-cols-2">

            {/* DATE — selector in create mode only */}
            {!isEdit && (
              <fieldset className="fieldset col-span-2 md:col-span-1">
                <legend className="fieldset-legend text-sm">Select an empty date</legend>
                <Select
                  id="date"
                  name="date_id"
                  aria-describedby="date-error"
                  required
                  onChange={(e) =>
                    setLegname(legNameByDateId[e.target.value] ?? "")
                  }
                >
                  <option value="">Select a date</option>
                  {emptyEntries.map((e) => (
                    <option key={e.date_id} value={e.date_id}>
                      {e.date}
                    </option>
                  ))}
                </Select>
                <div id="date-error" aria-live="polite" aria-atomic="true">
                  {formState.errors?.date_id?.map((error) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
                </div>
              </fieldset>
            )}

            {/* STATE */}
            <fieldset className="fieldset col-span-2 md:col-span-1">
              <legend className="fieldset-legend text-sm">State</legend>
              <Select
                id="state_id"
                name="state_id"
                aria-describedby="state-error"
                required
                defaultValue={entry?.state_id ?? ""}
              >
                <option value="">Select a state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <div id="state-error" aria-live="polite" aria-atomic="true">
                {formState.errors?.state_id?.map((error) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
              </div>
            </fieldset>

            {/* LEGNAME */}
            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend text-sm">{isEdit ? "Title / LegName" : "LegName"}</legend>
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
                {formState.errors?.legname?.map((error) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
              </div>
            </fieldset>

            {/* JOURNAL ENTRY */}
            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend text-sm">Journal Entry</legend>
              <TextArea
                id="text"
                name="text"
                placeholder="Write your thoughts here..."
                defaultValue={entry?.text ?? ""}
                aria-describedby="entry-error"
                required
                className="min-h-80"
              />
              <div id="entry-error" aria-live="polite" aria-atomic="true">
                {formState.errors?.text?.map((error) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
              </div>
            </fieldset>

          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button
          href={isEdit ? `/journal/${entry.entry_id}` : "/journal/listView"}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Entry
        </Button>
      </div>
    </form>
  );
}
