import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
// import Image from 'next/image';
import { lusitana } from "@/app/ui/fonts";
import { fetchJournal } from "@/app/lib/data";

import JournalCard from "./components/journal-card";

export default async function JournalList() {
  // const journalEntries = await fetchJournal();

  // const entries = journalEntries.filter((entry) => entry.has_text);

  return (
    <div className="flex w-full flex-col md:col-span-4">
      {/* <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Ascending order by date
      </h2>

      {entries.map((entry, i) => {
        return <JournalCard entry={entry} key={i} />;
      })} */}
    </div>
  );
}
