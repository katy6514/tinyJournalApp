import { lusitana } from "@/app/ui/fonts";
import JournalList from "@/app/ui/journal/journal-list";
import { AddEntry } from "@/app/ui/journal/buttons";
import { Suspense } from "react";

import Pagination from "@/app/ui/journal/pagination";
import Search from "@/app/ui/search";
import EntriesTable from "@/app/ui/journal/table";

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
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        List View
      </h1>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search entries..." />
      </div>
      <Suspense key={query + currentPage}>
        <EntriesTable query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
      <AddEntry />
      <JournalList />
    </main>
  );
}
