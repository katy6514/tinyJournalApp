"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";

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
  const draftKey = isEdit ? `journal-edit-draft-${entry.entry_id}` : null;

  const action = isEdit
    ? updateEntry.bind(null, entry.entry_id)
    : createEntry;

  const [formState, formAction] = useActionState(
    action as (state: State, formData: FormData) => Promise<State>,
    initialState,
  );

  const [legname, setLegname] = useState(entry?.legname ?? "");
  const [text, setText] = useState(entry?.text ?? "");
  const [stateId, setStateId] = useState(entry?.state_id?.toString() ?? "");
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore draft from localStorage on mount (edit mode only)
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.text !== undefined) setText(draft.text);
      if (draft.legname !== undefined) setLegname(draft.legname);
      if (draft.stateId !== undefined) setStateId(draft.stateId);
      setDraftRestored(true);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save to localStorage whenever form values change (edit mode only)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!draftKey) return;
    // Skip saving on the very first render so we don't overwrite a restored draft
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ text, legname, stateId }));
      } catch {}
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [text, legname, stateId, draftKey]);

  const clearDraft = useCallback(() => {
    if (!draftKey) return;
    try { localStorage.removeItem(draftKey); } catch {}
    setDraftRestored(false);
  }, [draftKey]);

  return (
    <form action={formAction}>
      {!isEdit && (
        <input type="hidden" name="returnPage" value={returnPage} />
      )}

      {draftRestored && (
        <div className="alert alert-warning mb-4 flex items-center justify-between py-2 px-4">
          <span className="text-sm">Unsaved draft restored.</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={clearDraft}
          >
            Dismiss
          </button>
        </div>
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
            <fieldset className={`fieldset ${isEdit ? "col-span-2" : "col-span-2 md:col-span-1"}`}>
              <legend className="fieldset-legend text-sm">State</legend>
              <Select
                id="state_id"
                name="state_id"
                aria-describedby="state-error"
                required
                value={isEdit ? stateId : undefined}
                defaultValue={isEdit ? undefined : (entry?.state_id?.toString() ?? "")}
                onChange={isEdit ? (e) => setStateId(e.target.value) : undefined}
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
                value={isEdit ? text : undefined}
                defaultValue={isEdit ? undefined : ""}
                onChange={isEdit ? (e) => setText(e.target.value) : undefined}
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
          variant="ghost"
          onClick={clearDraft}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" onClick={clearDraft}>
          Save Entry
        </Button>
      </div>
    </form>
  );
}
