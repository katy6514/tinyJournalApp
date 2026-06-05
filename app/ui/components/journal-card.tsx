import Image from "next/image";
import { parseISO, format } from "date-fns";
import { notoSerif } from "@/app/ui/fonts";
import { JournalEntry } from "@/app/lib/definitions";
import { StateIcon } from "./state-icon";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const { date, text, legname, state, photos } = entry;
  const photo = photos?.[0];
  const formattedDate = format(parseISO(date), "MMMM d, yyyy");

  return (
    <div className="card card-side bg-base-100 shadow-sm mb-4">
      <figure className="w-48 shrink-0">
        <Image
          src={photo ? photo.path : "/ContinentalDivideTrailLogo.png"}
          width={photo ? photo.width : 400}
          height={photo ? photo.height : 400}
          alt={photo ? (photo.title || photo.description || "") : "Continental Divide Trail"}
          className={
            photo
              ? "object-cover w-full h-full"
              : "object-cover w-full h-full grayscale opacity-50"
          }
        />
      </figure>
      <div className="card-body overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title">{legname}</h2>
          <StateIcon state={state} className="shrink-0 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
        <p className={`${notoSerif.className} text-sm line-clamp-2`}>{text}</p>
      </div>
    </div>
  );
}
