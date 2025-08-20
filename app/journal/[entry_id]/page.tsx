import Image from "next/image";

import { notoSerif } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";

import { fetchEntryByID, fetchPhotosForDateID } from "@/app/lib/data";
import { JournalEntry } from "@/app/lib/definitions";

import { EditEntry } from "@/app/ui/journal/buttons";

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
      <div className=" bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
        <h1 className={`${notoSerif.className} mb-4 text-xl md:text-2xl`}>
          single journal entry for {entry_id}
          {legname} - {state} on {date}
          {new Date(date + "T00:00:00").toLocaleDateString()}
        </h1>
        <EditEntry entry_id={entry_id} />

        <div className="">
          <p className={`${notoSerif.className}`}>{text}</p>
        </div>
        {photos &&
          photos.map((photo) => {
            return (
              <Image
                key={photo.photo_id}
                src={photo.path}
                width={photo.width}
                height={photo.height}
                className="block"
                alt=""
              />
            );
          })}
      </div>
    </main>
  );
}
