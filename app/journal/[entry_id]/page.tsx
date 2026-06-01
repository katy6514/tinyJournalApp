import { parseISO, format } from "date-fns";
import Link from "next/link";

import { notoSans, notoSerif } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";
import { PencilIcon, MapIcon } from "@heroicons/react/24/outline";

import {
  fetchEntryByID,
  fetchLegForDateID,
  fetchAdjacentEntries,
} from "@/app/lib/data";
import { JournalEntry } from "@/app/lib/definitions";
import { parseLegName } from "@/app/lib/utils";
import EntryPhotos from "@/app/ui/journal/entry-photos";
import EntryMiniMap from "@/app/ui/journal/entry-mini-map";

// import { EditEntry } from "@/app/ui/journal/buttons";

export default async function Page(props: {
  params: Promise<{ entry_id: string }>;
}) {
  const { entry_id } = await props.params;

  const entries = await fetchEntryByID(entry_id);
  const entry: JournalEntry = Array.isArray(entries) ? entries[0] : entries;

  if (!entry) {
    return <div>Entry not found</div>;
  }

  const { date, date_id, text, legname, state, photos } = entry || {};

  const [leg, adjacent] = await Promise.all([
    fetchLegForDateID(date_id),
    fetchAdjacentEntries(entry_id),
  ]);

  let legGeoJSON = null;
  if (leg?.coordinates) {
    const coords =
      typeof leg.coordinates === "string"
        ? JSON.parse(leg.coordinates)
        : leg.coordinates;
    if (Array.isArray(coords) && coords.length > 0) {
      legGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: { legnum: leg.legnum, name: leg.name },
          },
        ],
      };
    }
  }

  const formattedDate = format(parseISO(date), "MMMM d, yyyy");
  const { start: legStart, end: legEnd } = leg?.name ? parseLegName(leg.name) : { start: null, end: null };

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "View Entry",
            href: `/journal/${entry_id}`,
            active: true,
          },
        ]}
      />
      {/* Prev / Next navigation + action buttons */}
      <div className="flex justify-between items-center py-2 mb-2 w-[85%] mx-auto">
        {adjacent.prev ? (
          <Link href={`/journal/${adjacent.prev.entry_id}`} className="btn btn-ghost btn-sm gap-1">
            <span>←</span>
            <span>{format(parseISO(adjacent.prev.date), "MMM d, yyyy")}</span>
          </Link>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button href={`/journal/map?entry_id=${entry_id}`} icon={<MapIcon />} variant="secondary">
            View on Map
          </Button>
          <Button href={`/journal/${entry_id}/edit`} icon={<PencilIcon />} variant="secondary">
            Edit
          </Button>
        </div>
        {adjacent.next ? (
          <Link href={`/journal/${adjacent.next.entry_id}`} className="btn btn-ghost btn-sm gap-1">
            <span>{format(parseISO(adjacent.next.date), "MMM d, yyyy")}</span>
            <span>→</span>
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Metadata + minimap section */}
      <div className="flex gap-6 items-start p-6 w-[85%] mx-auto bg-white dark:bg-gray-700 rounded-lg shadow-sm">
        <div className="w-1/2 text-right">
          <h2 className={`${notoSans.className} mb-1 text-md md:text-lg text-gray-500 dark:text-gray-400`}>
            {formattedDate}
          </h2>
          <h1 className={`${notoSans.className} mb-1 text-xl md:text-2xl`}>
            {legname}
          </h1>
          <h2 className={`${notoSans.className} text-lg md:text-xl`}>
            {state}
          </h2>
          {(legStart || legEnd || leg?.mileage) && (
            <table className={`${notoSans.className} text-base text-gray-600 dark:text-gray-400 mt-3`}>
              <tbody>
                {legStart && (
                  <tr>
                    <td className="font-medium px-2 py-1">
                      <span className="flex items-center gap-2">
                        Start
                        <svg width="14" height="14" className="shrink-0"><circle cx="7" cy="7" r="5.5" fill="#16a34a" stroke="white" strokeWidth="1.5" /></svg>
                      </span>
                    </td>
                    <td className="px-2 py-1 text-left">{legStart}</td>
                  </tr>
                )}
                {legEnd && (
                  <tr>
                    <td className="font-medium px-2 py-1">
                      <span className="flex items-center gap-2">
                        End
                        <svg width="14" height="14" className="shrink-0"><rect x="1.5" y="1.5" width="11" height="11" fill="#dc2626" stroke="white" strokeWidth="1.5" /></svg>
                      </span>
                    </td>
                    <td className="px-2 py-1 text-left">{legEnd}</td>
                  </tr>
                )}
                {leg?.mileage && (
                  <tr>
                    <td className="font-medium px-2 py-1">Mileage</td>
                    <td className="px-2 py-1 text-left">{leg.mileage} mi</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {legGeoJSON && (
          <div className="w-1/2">
            <EntryMiniMap legGeoJSON={legGeoJSON} date={date} start={legStart} end={legEnd} />
          </div>
        )}
      </div>

      <hr className="w-[85%] mx-auto mt-8 border-gray-200 dark:border-gray-600" />

      {/* Constrained journal content */}
      <div className="max-w-3xl mx-auto p-6">
        <p className={`${notoSerif.className} whitespace-pre-wrap text-lg leading-loose mt-8`}>
          {text}
        </p>
        <div className="mt-8">
          <EntryPhotos photos={photos} />
        </div>
      </div>
    </main>
  );
}
