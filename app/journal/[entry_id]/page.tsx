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
        {/* Grid: col 1 = metadata then journal text, col 2 = minimap spanning both rows */}
        <div className={legGeoJSON ? "grid grid-cols-[1fr_50%] gap-4 items-start" : ""}>
          {/* Metadata */}
          <div className="flex justify-between gap-6 mb-6">
            <div>
              <h2 className={`${notoSans.className} mb-1 text-md md:text-lg text-gray-500 dark:text-gray-400`}>
                {formattedDate}
              </h2>
              <h1 className={`${notoSans.className} mb-1 text-xl md:text-2xl`}>
                {legname}
              </h1>
              <h2 className={`${notoSans.className} text-lg md:text-xl`}>
                {state}
              </h2>
            </div>
            {(legStart || legEnd || leg?.mileage) && (
              <table className={`${notoSans.className} text-sm text-gray-600 dark:text-gray-400 self-start mt-1`}>
                <tbody>
                  {legStart && (
                    <tr>
                      <td className="font-medium pr-4 py-0.5">
                        <span className="flex items-center gap-1.5">
                          Start
                          <svg width="14" height="14" className="shrink-0"><circle cx="7" cy="7" r="5.5" fill="#16a34a" stroke="white" strokeWidth="1.5" /></svg>
                        </span>
                      </td>
                      <td>{legStart}</td>
                    </tr>
                  )}
                  {legEnd && (
                    <tr>
                      <td className="font-medium pr-4 py-0.5">
                        <span className="flex items-center gap-1.5">
                          End
                          <svg width="14" height="14" className="shrink-0"><rect x="1.5" y="1.5" width="11" height="11" fill="#dc2626" stroke="white" strokeWidth="1.5" /></svg>
                        </span>
                      </td>
                      <td>{legEnd}</td>
                    </tr>
                  )}
                  {leg?.mileage && (
                    <tr>
                      <td className="font-medium pr-4 py-0.5">Mileage</td>
                      <td>{leg.mileage} mi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Mini map — spans metadata row + journal text row */}
          {legGeoJSON && (
            <div className="row-span-2">
              <EntryMiniMap legGeoJSON={legGeoJSON} date={date} start={legStart} end={legEnd} />
            </div>
          )}

          {/* Journal text */}
          <div>
            <p className={`${notoSerif.className} whitespace-pre-wrap`}>
              {text}
            </p>
          </div>
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
