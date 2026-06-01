import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";
import Search from "@/app/ui/search";

import { PlusIcon } from "@heroicons/react/24/outline";

import JournalList from "@/app/ui/journal/journal-list";

import Pagination from "@/app/ui/journal/pagination";
import { fetchFilteredEntries } from "@/app/lib/data";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const { entries, totalPages } = await fetchFilteredEntries(query, currentPage);

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "All entries",
            href: `/journal/listView`,
            active: true,
          },
        ]}
      />
      <div className="max-w-3xl mx-auto p-6">
        <div className="my-4 flex items-center justify-between md:my-8">
          <Search placeholder="Search entries..." />
          <Button href={`/journal/create?returnPage=${currentPage}`} variant="primary" icon={<PlusIcon />}>
            Add Entry
          </Button>
        </div>
        <JournalList entries={entries} />
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
        <Button href={"/journal/create"} variant="primary" icon={<PlusIcon />}>
          Add Entry
        </Button>{" "}
      </div>
    </main>
  );
}
