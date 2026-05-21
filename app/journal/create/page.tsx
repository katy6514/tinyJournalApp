import EntryForm from "@/app/ui/journal/entry-form";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchEmptyEntries, fetchAssignedLegs, fetchStates } from "@/app/lib/data";

export default async function Page(props: {
  searchParams?: Promise<{ returnPage?: string }>;
}) {
  const searchParams = await props.searchParams;
  const returnPage = searchParams?.returnPage || "1";

  const [emptyEntries, assignedLegs, states] = await Promise.all([
    fetchEmptyEntries(),
    fetchAssignedLegs(),
    fetchStates(),
  ]);
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
      <EntryForm emptyEntries={emptyEntries} legNameByDateId={legNameByDateId} returnPage={returnPage} states={states} />
    </main>
  );
}
