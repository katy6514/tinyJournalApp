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

  const shimmer = `before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent`;

  const bgWhite = "bg-white dark:bg-gray-800";
  const bgGray50 = "bg-gray-50 dark:bg-gray-700";
  const bgGray100 = "bg-gray-100 dark:bg-gray-600";
  const bgGray200 = "bg-gray-200 dark:bg-gray-500";

  return (
    <>
      <div
        className={`before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent grid grid-cols-3 grid-rows-2 gap-4 mb-8 pr-4 ${bgGray100}`}
      >
        <div className={`row-span-3 ${bgGray100}`}>
          <div
            className={`flex items-center justify-center w-full h-full ${bgGray200}`}
          >
            <svg
              className="w-10 h-10 text-gray-100 dark:text-gray-600"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 18"
            >
              <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
            </svg>
          </div>
        </div>
        <div
          className={`col-span-2 row-span-1 p-4 bg-gray-50 dark:bg-gray-700`}
        >
          <div className={`h-8 w-80 mb-2 rounded-md ${bgGray200}`} />
          <div className={`h-5 w-50 mb-2 rounded-md ${bgGray200}`} />
          <div className={`h-4 w-30 mb-2 rounded-md ${bgGray200}`} />
        </div>
        <div className={`col-span-2 row-span-1 h-auto p-4 ${bgWhite}`} />
      </div>

      <article className="shadow-lg grid grid-cols-3 grid-rows-2 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600">
        <div className="row-span-3 bg-white dark:bg-gray-700">
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
    </>
  );
}
