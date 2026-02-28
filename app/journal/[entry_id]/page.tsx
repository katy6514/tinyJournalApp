import { parseISO, format } from "date-fns";
import Link from "next/link";

import { notoSans, notoSerif } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";
import { PencilIcon } from "@heroicons/react/24/outline";

import { fetchEntryByID, fetchLegForDateID, fetchAdjacentEntries } from "@/app/lib/data";
import { JournalEntry } from "@/app/lib/definitions";
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
        <h1 className={`${notoSans.className} mb-4 text-xl md:text-2xl`}>
          {legname}
        </h1>
        {/* {name && (
          <h2
            className={`${notoSans.className} mb-4 text-blue-500 text-lg md:text-xl`}
          >
            fetched LegName: {name}
          </h2>
        )} */}
        <h2 className={`${notoSans.className} mb-4 text-lg md:text-xl`}>
          {state}
        </h2>
        <h2 className={`${notoSans.className} mb-4 text-md md:text-lg`}>
          {formattedDate}
        </h2>
        {/* <EditEntry entry_id={entry_id} /> */}
        <Button
          href={`/journal/${entry_id}/edit`}
          icon={<PencilIcon />}
          variant="light"
        >
          Edit
        </Button>

        <EntryMiniMap legGeoJSON={legGeoJSON} date={date} />

        <div className="">
          <p className={`${notoSerif.className} whitespace-pre-wrap`}>{text}</p>
        </div>
        <EntryPhotos photos={photos} />
      </div>
    </main>
  );
}
