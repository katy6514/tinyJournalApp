import { parseISO, format } from "date-fns";

import EntryForm from "@/app/ui/journal/entry-form";
import EntryPhotos from "@/app/ui/journal/entry-photos";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { fetchEntryByID, fetchStates, fetchLegForDateID } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { JournalEntry } from "@/app/lib/definitions";
import { parseLegName } from "@/app/lib/utils";
import { notoSans } from "@/app/ui/fonts";

export default async function Page(props: {
  params: Promise<{ entry_id: string }>;
}) {
  const { entry_id } = await props.params;

  const [entries, states] = await Promise.all([
    fetchEntryByID(entry_id),
    fetchStates(),
  ]);
  const entry: JournalEntry = Array.isArray(entries) ? entries[0] : entries;

  if (!entry) {
    notFound();
  }

  const leg = await fetchLegForDateID(entry.date_id);
  const formattedDate = format(parseISO(entry.date), "MMMM d, yyyy");
  const { start: legStart, end: legEnd } = leg?.name
    ? parseLegName(leg.name)
    : { start: null, end: null };

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "Edit Entry",
            href: `/journal/${entry_id}/edit`,
            active: true,
          },
        ]}
      />
      <div className="flex gap-8 p-6">

        {/* Left column: metadata + photos */}
        <div className="w-1/3 shrink-0 space-y-4 sticky top-6 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">
          <div className="card bg-base-100 dark:bg-gray-700 shadow-sm border border-base-200 dark:border-gray-600">
            <div className="card-body p-5">
              <h2 className={`${notoSans.className} text-sm text-gray-500 dark:text-gray-400`}>
                {formattedDate}
              </h2>
              <h1 className={`${notoSans.className} text-xl font-semibold leading-snug`}>
                {entry.legname}
              </h1>
              <h2 className={`${notoSans.className} text-lg text-gray-700 dark:text-gray-300`}>
                {entry.state}
              </h2>
              {(legStart || legEnd || leg?.mileage) && (
                <>
                  <div className="divider my-1" />
                  <table className={`${notoSans.className} text-sm text-gray-600 dark:text-gray-400`}>
                  <tbody>
                    {legStart && (
                      <tr>
                        <td className="font-medium pr-3 py-1">
                          <span className="flex items-center gap-1.5">
                            Start
                            <svg width="14" height="14" className="shrink-0"><circle cx="7" cy="7" r="5.5" fill="#16a34a" stroke="white" strokeWidth="1.5" /></svg>
                          </span>
                        </td>
                        <td className="py-1">{legStart}</td>
                      </tr>
                    )}
                    {legEnd && (
                      <tr>
                        <td className="font-medium pr-3 py-1">
                          <span className="flex items-center gap-1.5">
                            End
                            <svg width="14" height="14" className="shrink-0"><rect x="1.5" y="1.5" width="11" height="11" fill="#dc2626" stroke="white" strokeWidth="1.5" /></svg>
                          </span>
                        </td>
                        <td className="py-1">{legEnd}</td>
                      </tr>
                    )}
                    {leg?.mileage && (
                      <tr>
                        <td className="font-medium pr-3 py-1">Mileage</td>
                        <td className="py-1">{leg.mileage} mi</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </>
              )}
            </div>
          </div>

          {entry.photos?.length > 0 && (
            <div className="card bg-base-100 dark:bg-gray-700 shadow-sm border border-base-200 dark:border-gray-600">
              <div className="card-body p-5">
                <p className={`${notoSans.className} text-sm font-medium text-gray-500 dark:text-gray-400 mb-2`}>
                  Photos from this day
                </p>
                <EntryPhotos photos={entry.photos} maxPhotosPerRow={1} />
              </div>
            </div>
          )}
        </div>

        {/* Right column: form */}
        <div className="flex-1 min-w-0">
          <EntryForm entry={entry} states={states} />
        </div>

      </div>
    </main>
  );
}
