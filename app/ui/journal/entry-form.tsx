"use client";

import { useActionState, useState } from "react";

import { createEntry, updateEntry, State } from "@/app/lib/actions/entries";
import { JournalEntry, StateOption } from "@/app/lib/definitions";

import { Button } from "../components/button";
import { Select, Input, TextArea, Label } from "../components/inputs";

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
      <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6">
        <div className="grid gap-6 mb-6 grid-cols-2 grid-rows-4">

          {/* DATE — selector in create mode, heading in edit mode */}
          <div className="col-span-2 md:col-span-1 row-span-1">
            {isEdit ? (
              <h3 className="text-lg font-semibold">updating {entry.date}</h3>
            ) : (
              <>
                <Label htmlFor="date">Select an empty date</Label>
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
              </>
            )}
          </div>

          {/* STATE */}
          <div className="col-span-2 md:col-span-1 row-span-1">
            <Label htmlFor="state_id">State</Label>
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
          </div>

          {/* LEGNAME */}
          <div className="col-span-2 row-span-1">
            <Label htmlFor="legname">{isEdit ? "Title / LegName" : "LegName"}</Label>
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
          </div>

          {/* JOURNAL ENTRY */}
          <div className="col-span-2 row-span-2">
            <Label htmlFor="text">Journal Entry</Label>
            <TextArea
              id="text"
              name="text"
              placeholder="Write your thoughts here..."
              defaultValue={entry?.text ?? ""}
              aria-describedby="entry-error"
              required
            />
            <div id="entry-error" aria-live="polite" aria-atomic="true">
              {formState.errors?.text?.map((error) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            </div>
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
