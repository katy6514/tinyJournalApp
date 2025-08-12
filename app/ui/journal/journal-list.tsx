
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
// import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { fetchJournal } from '@/app/lib/data';

import { JournalEntry } from '@/app/lib/definitions';
// import { fetchLatestInvoices } from '@/app/lib/data';


export default async function JournalList() {
    // const latestInvoices = await fetchLatestInvoices();
    const journalEntries = await fetchJournal();

  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Latest Entries
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        {/* NOTE: Uncomment this code in Chapter 7 */}

        <div className="bg-white px-6">
          {journalEntries.map((entry, i) => {
            return (
              <div
                key={entry.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t': i !== 0,
                  },
                )}
              >
                <div className="flex items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold md:text-base">
                      {entry.date.toString()}
                    </p>
                    <p className="hidden text-sm text-gray-500 sm:block">
                      {entry.id}
                    </p>
                  </div>
                </div>
                <p
                  className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                >
                  {entry.text}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}
