import Form from "@/app/ui/journal/create-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchJournal, fetchAssignedLegs } from "@/app/lib/data";

export default async function Page() {
  const [journalEntries, assignedLegs] = await Promise.all([
    fetchJournal(),
    fetchAssignedLegs(),
  ]);
  const emptyEntries = journalEntries.filter((entry) => !entry.has_text);
  const legNameByDateId: Record<string, string> = Object.fromEntries(
    assignedLegs.map((l) => [l.date_id, l.name])
  );

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
      <Form emptyEntries={emptyEntries} legNameByDateId={legNameByDateId} />
    </main>
  );
}
