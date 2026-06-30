"use client";

import { useActionState, useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

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

  // Pre-compute for use in the restore effect (avoids narrowing issues inside the closure).
  const savedText = entry?.text ?? "";
  const savedLegname = entry?.legname ?? "";
  const savedStateId = entry?.state_id?.toString() ?? "";

  // fix #2: use the project's existing useDebouncedCallback instead of hand-rolled setTimeout.
  // fix #3: clearDraft calls saveDraft.cancel() so a pending timer can't ghost-resurrect the draft.
  const saveDraft = useDebouncedCallback(() => {
    if (!draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ text, legname, stateId }));
    } catch {}
  }, 1000);

  // Restore draft on mount (edit mode only).
  // fix #6: draftKey is stable for the component's lifetime, so [draftKey] is correct and needs no lint suppress.
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved);

      // Silently discard if the draft matches the current saved entry — it's a stale post-save draft.
      if (
        draft.text === savedText &&
        draft.legname === savedLegname &&
        draft.stateId === savedStateId
      ) {
        localStorage.removeItem(draftKey);
        return;
      }

      if (draft.text !== undefined) setText(draft.text);
      if (draft.legname !== undefined) setLegname(draft.legname);
      // fix #4: only restore stateId if it still exists in the states list.
      if (draft.stateId !== undefined && states.some((s) => s.id.toString() === draft.stateId)) {
        setStateId(draft.stateId);
      }
      setDraftRestored(true);
    } catch {}
  }, [draftKey, savedText, savedLegname, savedStateId, states]); // fix #5: isFirstRender ref removed — saveDraft is now called from onChange, not a useEffect, so it never fires on initial render

  // fix #3: cancel any pending save before clearing so the timer can't re-write after removal.
  function clearDraft() {
    saveDraft.cancel();
    if (!draftKey) return;
    try { localStorage.removeItem(draftKey); } catch {}
    setDraftRestored(false);
  }

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
                defaultValue={isEdit ? undefined : ""}
                onChange={isEdit ? (e) => { setStateId(e.target.value); saveDraft(); } : undefined}
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
                onChange={(e) => { setLegname(e.target.value); saveDraft(); }}
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
                onChange={isEdit ? (e) => { setText(e.target.value); saveDraft(); } : undefined}
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
        {/* fix #1: flush the draft on save (so the last keystroke is captured) but don't clear it —
            the server redirects on success, and the post-save draft is silently discarded on next
            mount because it matches the freshly-saved entry values. */}
        <Button variant="primary" type="submit" onClick={() => saveDraft.flush()}>
          Save Entry
        </Button>
      </div>
    </form>
  );
}
