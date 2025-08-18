import Image from "next/image";
import { EditEntry } from "@/app/ui/journal/buttons";
// import { formatDateToLocal, formatCurrency } from "@/app/lib/utils";
import { fetchFilteredEntries } from "@/app/lib/data";
import JournalCard from "./components/journal-card";

export default async function EntriesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const entries = await fetchFilteredEntries(query, currentPage);
  console.log("table component");
  // console.log({ entries });

  return (
    <div>
      {entries.map((entry, i) => {
        return <JournalCard entry={entry} key={i} />;
      })}
      {/* {entries?.map((entry) => (
        <div key={entry.id} className="mb-2 w-full rounded-md bg-white p-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="mb-2 flex items-center">
                <p>{entry.date}</p>
              </div>
              <p className="text-sm text-gray-500">{entry.state}</p>
            </div>
            
          </div>
          <div className="flex w-full items-center justify-between pt-4">
            <div>
              <p className="text-xs">{entry.text}</p>
            </div>
            <div className="flex justify-end gap-2">
              <EditEntry id={entry.id} />
            </div>
          </div>
        </div>
      ))} */}
    </div>
  );
}
