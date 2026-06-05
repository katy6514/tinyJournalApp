import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";
import Search from "@/app/ui/search";
import { PlusIcon } from "@heroicons/react/24/outline";

import JournalList from "@/app/ui/journal/journal-list";
import Pagination from "@/app/ui/journal/pagination";
import TrailStatsPanel from "@/app/ui/journal/trail-stats-panel";
import RandomPhotoPanel from "@/app/ui/journal/random-photo-panel";

import {
  fetchFilteredEntries,
  fetchTrailStats,
  fetchRandomPhotoWithEntry,
} from "@/app/lib/data";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  const [{ entries, totalPages }, stats, randomPhoto] = await Promise.all([
    fetchFilteredEntries(query, currentPage),
    fetchTrailStats(),
    fetchRandomPhotoWithEntry(),
  ]);

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          { label: "All entries", href: "/journal/listView", active: true },
        ]}
      />
      <div className="flex gap-6 p-6">

        {/* Left column: 2/3 — search + list + pagination */}
        <div className="flex-[2] min-w-0">
          <div className="my-4 flex items-center justify-between md:my-6">
            <Search placeholder="Search entries..." />
            <Button href={`/journal/create?returnPage=${currentPage}`} variant="primary" icon={<PlusIcon />}>
              Add Entry
            </Button>
          </div>
          <JournalList entries={entries} />
          <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={totalPages} />
          </div>
        </div>

        {/* Right column: 1/3 — stats + random photo */}
        <div className="flex-[1] min-w-0 space-y-4 mt-4 md:mt-6">
          <TrailStatsPanel stats={stats} />
          {randomPhoto && <RandomPhotoPanel photo={randomPhoto} />}
        </div>

      </div>
    </main>
  );
}
