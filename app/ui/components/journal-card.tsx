"use client";

import Image from "next/image";
import Link from "next/link";
import { parseISO, format } from "date-fns";

import { notoSerif } from "@/app/ui/fonts";

import { JournalEntry, Photo } from "@/app/lib/definitions";
import { Button } from "@/app/ui/components/button";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const { date, date_id, entry_id, text, legname, state, photos } = entry;

  const photo = photos?.[0];

  const formattedDate = format(parseISO(date), "MMMM d, yyyy");

  return (
    <article className="grid grid-cols-3 grid-rows-2 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600">
      <div className="row-span-2 bg-white dark:bg-gray-700">
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
      <header className="col-span-2 row-span-1 p-4 mt-4 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold">{legname}</h3>
        <p className="text-md font-semibold">{state}</p>
        <p className="text-sm text-gray-500">{formattedDate}</p>
      </header>
      <section className="col-span-2 row-span-1 h-auto p-4 mb-4 bg-white dark:bg-gray-800">
        <p className={`${notoSerif.className} font-medium line-clamp-4`}>
          {text}
        </p>
      </section>
    </article>
  );
}
