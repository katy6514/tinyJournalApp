import { fetchFilteredEntriesWithPhotos } from "@/app/lib/data";
import JournalCard from "./components/journal-card";

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
        return <JournalCard entry={entry} key={entry.entry_id} />;
      })}
    </div>
  );
}
