import Image from "next/image";
import { EditEntry } from "@/app/ui/journal/buttons";
// import { formatDateToLocal, formatCurrency } from "@/app/lib/utils";
import { fetchFilteredEntries } from "@/app/lib/data";
import JournalCard from "./components/journal-card";

export default async function JournalList({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const entries = await fetchFilteredEntries(query, currentPage);

  return (
    <div>
      {entries.map((entry, i) => {
        return <JournalCard entry={entry} key={i} />;
      })}
    </div>
  );
}
