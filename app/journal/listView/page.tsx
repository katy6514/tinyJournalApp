import { lusitana } from '@/app/ui/fonts';
import JournalList from '@/app/ui/journal/journal-list';



export default async function Page() {
    // const journalEntries = await fetchJournal();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        List View
      </h1>
      <JournalList />
    </main>
  );
}