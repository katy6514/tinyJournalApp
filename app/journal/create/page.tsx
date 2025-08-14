import Form from "@/app/ui/journal/create-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchJournal } from "@/app/lib/data";

export default async function Page() {
  const journalEntries = await fetchJournal();
  const emptyEntries = journalEntries.filter((entry) => !entry.has_text);

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Entries", href: "/journal/listView" },
          {
            label: "Create Entry",
            href: "/journal/listView/create",
            active: true,
          },
        ]}
      />
      <Form emptyEntries={emptyEntries} />
    </main>
  );
}
