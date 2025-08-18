import EditEntryForm from "@/app/ui/journal/edit-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchEntryByID } from "@/app/lib/data";
import { notFound } from "next/navigation";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const entry = await fetchEntryByID(id);

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
            href: `/journal/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditEntryForm entry={entry} />
    </main>
  );
}
