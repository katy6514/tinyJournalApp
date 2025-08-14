import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
// import Image from 'next/image';
import { lusitana } from "@/app/ui/fonts";
import { fetchJournal } from "@/app/lib/data";

import { UpdateEntry } from "@/app/ui/journal/buttons";

import { JournalEntry } from "@/app/lib/definitions";
// import { fetchLatestInvoices } from '@/app/lib/data';

export default async function JournalList() {
  // const latestInvoices = await fetchLatestInvoices();
  const journalEntries = await fetchJournal();

  const entries = journalEntries.filter((entry) => entry.has_text);
  // const emptyEntries = journalEntries.filter((entry) => !entry.has_text);

  // console.log({ emptyEntries });
  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Ascending order by date
      </h2>

      {entries.map((entry, i) => {
        const { date, date_id, id, text, legname, state } =
          entry as JournalEntry;

        const timeZoneCorrectedDate = new Date(
          date + "T00:00:00"
        ).toDateString();

        // console.log(entry);
        return (
          <div
            key={date_id}
            className="grid grid-flow-col grid-rows-3 gap-4 rounded-xl bg-gray-50 dark:bg-gray-600 p-4 mb-8"
          >
            <div className="row-span-3 rounded-lg bg-white dark:bg-gray-700 w-40">
              eventual image
            </div>
            <div className="col-span-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 max-w-full overflow-hidden">
              <p className="truncate text-sm font-semibold md:text-base">
                {legname} - {state}
              </p>
              <p className="hidden text-sm text-gray-500 sm:block">
                {timeZoneCorrectedDate}
              </p>
            </div>
            <div className="col-span-2 row-span-2  rounded-lg bg-white dark:bg-gray-800 p-4  ">
              <p
                className={`${lusitana.className}  max-w-full   overflow-hidden text-ellipsis  wrap-break-word font-medium md:text-base `}
              >
                {text}
              </p>
            </div>
            <UpdateEntry id={id} />
          </div>
        );
      })}
      {/* <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div> */}
    </div>
  );
}
