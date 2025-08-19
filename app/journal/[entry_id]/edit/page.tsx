import EditEntryForm from "@/app/ui/journal/edit-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchEntryByID } from "@/app/lib/data";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { entry_id: string };
}) {
  const { entry_id } = params;

  const entry = await fetchEntryByID(entry_id);

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
