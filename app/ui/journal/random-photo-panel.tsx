import Image from "next/image";
import Link from "next/link";
import { parseISO, format } from "date-fns";
import { notoSans, notoSerif } from "@/app/ui/fonts";

interface RandomPhoto {
  photo_id: string;
  path: string;
  width: number;
  height: number;
  title: string;
  description: string;
  entry_id: string;
  date: string;
  legname: string;
}

export default function RandomPhotoPanel({ photo }: { photo: RandomPhoto }) {
  const formattedDate = format(parseISO(photo.date), "MMMM d, yyyy");

  return (
    <Link href={`/journal/${photo.entry_id}`} className="block group">
      <div className="card bg-base-100 dark:bg-gray-700 shadow-sm border border-base-200 dark:border-gray-600 overflow-hidden">
        <figure className="relative h-48 w-full">
          <Image
            src={photo.path}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            alt={photo.title || photo.description || photo.legname}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </figure>
        <div className="card-body p-4">
          <p className={`${notoSans.className} text-xs text-gray-400 dark:text-gray-500`}>{formattedDate}</p>
          <p className={`${notoSans.className} text-sm font-medium leading-snug`}>{photo.legname}</p>
          {photo.description && (
            <p className={`${notoSerif.className} text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1`}>
              {photo.description}
            </p>
          )}
          <p className={`${notoSans.className} text-xs text-primary mt-1 group-hover:underline`}>
            View entry →
          </p>
        </div>
      </div>
    </Link>
  );
}
