import EditEntryForm from "@/app/ui/journal/edit-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchEntryByID } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { JournalEntry } from "@/app/lib/definitions";

export default async function Page(props: {
  params: Promise<{ entry_id: string }>;
}) {
  const { entry_id } = await props.params; // <-- await here

  const entries = await fetchEntryByID(entry_id);
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
      <EditEntryForm entry={entry} />
    </main>
  );
}
