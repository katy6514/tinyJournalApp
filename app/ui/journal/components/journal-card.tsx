import { EditEntry } from "@/app/ui/journal/buttons";
import { lusitana } from "@/app/ui/fonts";

import { JournalEntry } from "@/app/lib/definitions";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const { date, date_id, id, text, legname, state } = entry;

  const timeZoneCorrectedDate = new Date(date + "T00:00:00").toDateString();
  return (
    <div
      key={date_id}
      className="grid grid-flow-col grid-rows-3 gap-4  bg-gray-50 dark:bg-gray-600 p-4 mb-8"
    >
      <div className="row-span-3  bg-white dark:bg-gray-700 w-40">
        eventual image
      </div>
      <div className="col-span-2  bg-gray-50 dark:bg-gray-800 p-4 max-w-full overflow-hidden">
        <p className="truncate text-sm font-semibold md:text-base">
          {legname} - {state}
        </p>
        <p className=" text-sm text-gray-500 sm:block">
          {timeZoneCorrectedDate}
        </p>
      </div>
      <div className="col-span-2 row-span-2   bg-white dark:bg-gray-800 p-4  ">
        <p
          className={`${lusitana.className}  max-w-full   overflow-hidden text-ellipsis  wrap-break-word font-medium md:text-base `}
        >
          {text}
        </p>
      </div>
      <EditEntry id={id} />
    </div>
  );
}
