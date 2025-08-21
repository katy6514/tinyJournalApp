import { fetchFilteredEntriesWithPhotos } from "@/app/lib/data";
import JournalCard from "./components/journal-card";
import Link from "next/link";

export default async function JournalList({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const entries = await fetchFilteredEntriesWithPhotos(query, currentPage);

  return (
    <div>
      {entries.map((entry, i) => {
        return (
          <Link
            href={`/journal/${entry.entry_id}`}
            className="block"
            key={entry.entry_id}
          >
            <JournalCard entry={entry} />
          </Link>
        );
      })}
    </div>
  );
}
