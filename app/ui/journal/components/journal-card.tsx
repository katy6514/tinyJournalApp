"use client";

import Image from "next/image";

import { notoSerif } from "@/app/ui/fonts";

import { JournalEntry, Photo } from "@/app/lib/definitions";
import { Button } from "../../button";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const { date, date_id, entry_id, text, legname, state, photos } = entry;

  const photo = photos?.[0];

  // Safer date formatting
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div
        className={`grid grid-cols-3 grid-rows-3 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600`}
      >
        <div className="row-span-3 bg-gray-100 dark:bg-gray-700"></div>

        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="h-15 w-50 rounded-md bg-gray-200" />
        </div>
        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="h-7 w-20 rounded-md bg-gray-200" />
        </div>
        <div className="col-span-2 row-span-1 h-auto p-4 bg-white dark:bg-gray-800"></div>
        <div className="col-span-2 row-span-1">
          <div className="h-10 w-20 rounded-md bg-gray-200" />
        </div>
      </div>
      <article className="grid grid-cols-3 grid-rows-4 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600">
        <div className="row-span-4 bg-white dark:bg-gray-700">
          {photo && (
            <Image
              key={photo.photo_id}
              src={photo.path}
              width={photo.width}
              height={photo.height}
              alt={photo.title || photo.description || ""}
              className="object-cover w-full h-full"
            />
          )}
        </div>
        <header className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-semibold">
            {legname} - {state}
          </p>
        </header>
        <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
        <section className="col-span-2 row-span-2 h-auto p-4 bg-white dark:bg-gray-800">
          <p className={`${notoSerif.className} font-medium line-clamp-4`}>
            {text}
          </p>
        </section>
        <footer className="col-span-2 row-span-1">
          <Button href={`/journal/${entry_id}`} variant="dark">
            View
          </Button>
        </footer>
      </article>
    </>
  );
}
