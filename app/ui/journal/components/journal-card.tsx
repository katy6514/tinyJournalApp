"use client";

import Image from "next/image";

import { lusitana } from "@/app/ui/fonts";

import { JournalEntry, Photo } from "@/app/lib/definitions";
import { Button } from "../../button";

export default function JournalCard({
  entry,
}: {
  entry: JournalEntry & { photos: Photo[] };
}) {
  const { date, date_id, entry_id, text, legname, state, photos } = entry;

  const photo = photos?.[0] as Photo | undefined;

  // console.log({ photo });

  const timeZoneCorrectedDate = new Date(date + "T00:00:00").toDateString();
  return (
    <>
      <div
        key={date_id}
        className="grid grid-cols-3 grid-rows-4 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600"
      >
        <div className="row-span-4 p-4 bg-white dark:bg-gray-700">
          eventual image
          {photo && (
            <Image
              key={photo.photo_id}
              src={photo.path}
              width={photo.width}
              height={photo.height}
              alt={photo.title || ""}
            />
          )}
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
          <Button href={`/journal/${entry_id}`} variant="dark">
            View
          </Button>
          {/* <!-- Modal toggle --> */}
          {/* <Button onClick={() => setIsModalOpen(true)} variant="dark">
            View
          </Button> */}
        </div>
      </div>
    </>
  );
}
