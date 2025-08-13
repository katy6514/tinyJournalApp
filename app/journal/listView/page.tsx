import { lusitana } from "@/app/ui/fonts";
import JournalList from "@/app/ui/journal/journal-list";
import { AddEntry } from "@/app/ui/journal/buttons";

export default async function Page() {
  // const journalEntries = await fetchJournal();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        List View
      </h1>
      <AddEntry />
      <JournalList />
    </main>
  );
}
