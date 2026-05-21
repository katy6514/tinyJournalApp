import EntryForm from "@/app/ui/journal/entry-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchEntryByID, fetchStates } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { JournalEntry } from "@/app/lib/definitions";

export default async function Page(props: {
  params: Promise<{ entry_id: string }>;
}) {
  const { entry_id } = await props.params; // <-- await here

  const [entries, states] = await Promise.all([
    fetchEntryByID(entry_id),
    fetchStates(),
  ]);
  const entry: JournalEntry = Array.isArray(entries) ? entries[0] : entries;

  if (!entry) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "Edit Entry",
            href: `/journal/${entry_id}/edit`,
            active: true,
          },
        ]}
      />
      <EntryForm entry={entry} states={states} />
    </main>
  );
}
