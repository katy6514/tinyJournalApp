import { parseISO, format } from "date-fns";
import Link from "next/link";

import { notoSans, notoSerif } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";
import { PencilIcon } from "@heroicons/react/24/outline";

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
      <div className="flex justify-between px-4 py-2 text-sm">
        {adjacent.prev ? (
          <Link
            href={`/journal/${adjacent.prev.entry_id}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            ← prev day: {format(parseISO(adjacent.prev.date), "MMMM d, yyyy")}
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link
            href={`/journal/${adjacent.next.entry_id}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            next day: {format(parseISO(adjacent.next.date), "MMMM d, yyyy")} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className=" bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
        {/* Metadata + minimap row */}
        <div className="flex gap-4 items-start mb-6">
          <div className="flex-1 min-w-0">
            <h1 className={`${notoSans.className} mb-2 text-xl md:text-2xl`}>
              {legname}
            </h1>
            <h2 className={`${notoSans.className} mb-2 text-lg md:text-xl`}>
              {state}
            </h2>
            <h2 className={`${notoSans.className} mb-2 text-md md:text-lg`}>
              {formattedDate}
            </h2>
            {(legStart || legEnd || leg?.mileage) && (
              <dl className={`${notoSans.className} mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1`}>
                {legStart && (
                  <div className="flex gap-2">
                    <dt className="font-medium">Start</dt>
                    <dd>{legStart}</dd>
                  </div>
                )}
                {legEnd && (
                  <div className="flex gap-2">
                    <dt className="font-medium">End</dt>
                    <dd>{legEnd}</dd>
                  </div>
                )}
                {leg?.mileage && (
                  <div className="flex gap-2">
                    <dt className="font-medium">Mileage</dt>
                    <dd>{leg.mileage} mi</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
          {legGeoJSON && (
            <div className="w-1/2 shrink-0">
              <EntryMiniMap legGeoJSON={legGeoJSON} date={date} start={legStart} end={legEnd} />
            </div>
          )}
        </div>

        {/* Journal text */}
        <div className="flex-1 min-w-0">
          <p className={`${notoSerif.className} whitespace-pre-wrap`}>
            {text}
          </p>
        </div>
        <EntryPhotos photos={photos} />
        <div className="mt-6 flex justify-end">
          <Button
            href={`/journal/${entry_id}/edit`}
            icon={<PencilIcon />}
            variant="secondary"
          >
            Edit
          </Button>
        </div>
      </div>
    </main>
  );
}
