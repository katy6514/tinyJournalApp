"use client";

import { EditEntry } from "@/app/ui/journal/buttons";
import { lusitana } from "@/app/ui/fonts";

import { JournalEntry } from "@/app/lib/definitions";
import { Button } from "../../button";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const { date, date_id, id, text, legname, state } = entry;

  const timeZoneCorrectedDate = new Date(date + "T00:00:00").toDateString();
  return (
    <>
      <div
        key={date_id}
        className="grid grid-cols-3 grid-rows-4 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600"
      >
        <div className="row-span-4 p-4 bg-white dark:bg-gray-700">
          eventual image
        </div>
        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-semibold">
            {legname} - {state}
          </p>
        </div>
        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-500">{timeZoneCorrectedDate}</p>
        </div>
        <div className="col-span-2 row-span-2  p-4 bg-white dark:bg-gray-800">
          <p className={`${lusitana.className} font-medium truncate`}>{text}</p>
        </div>
        <div className="col-span-2 row-span-1">
          <Button href={`/journal/${id}`} variant="dark">
            View
          </Button>
          {/* <!-- Modal toggle --> */}
          {/* <Button onClick={() => setIsModalOpen(true)} variant="dark">
            View
          </Button> */}
          <EditEntry id={id} />
        </div>
      </div>
    </>
  );
}
