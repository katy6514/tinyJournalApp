import { notoSerif } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";

import { PlusIcon } from "@heroicons/react/24/outline";

import JournalList from "@/app/ui/journal/journal-list";
import { Suspense } from "react";

import Pagination from "@/app/ui/journal/pagination";
import Search from "@/app/ui/search";

import { fetchJournalsPages } from "@/app/lib/data";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchJournalsPages(query);

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
      <div className="mt-4 flex items-center justify-between gap-2 pb-8 md:mt-8">
        <Search placeholder="Search entries..." />
      </div>
      <Suspense key={query + currentPage}>
        <JournalList query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
      <Button href={"/journal/create"} variant="dark" icon={<PlusIcon />}>
        Add Entry
      </Button>{" "}
    </main>
  );
}
