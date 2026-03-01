import Image from "next/image";
import { parseISO, format } from "date-fns";
import { notoSerif } from "@/app/ui/fonts";
import { JournalEntry } from "@/app/lib/definitions";

export default function JournalCard({ entry }: { entry: JournalEntry }) {
  const { date, text, legname, state, photos, assigned_leg_name } = entry;
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
      <div className="card-body">
        <h2 className="card-title">{legname}</h2>
        <p className="text-sm">{state} · {formattedDate}</p>
        <p className="text-xs text-warning">
          {assigned_leg_name ? `Leg: ${assigned_leg_name}` : "no leg assigned"}
        </p>
        <p className={`${notoSerif.className} text-sm line-clamp-3`}>{text}</p>
      </div>
    </div>
  );
}
