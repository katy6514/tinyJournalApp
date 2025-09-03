import Image from "next/image";

import { parseISO, format } from "date-fns";

import { notoSans, notoSerif } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import { Button } from "@/app/ui/components/button";
import { PencilIcon } from "@heroicons/react/24/outline";

import { fetchEntryByID, fetchLegForDateID } from "@/app/lib/data";
import { JournalEntry } from "@/app/lib/definitions";

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

  const { name } = await fetchLegForDateID(date_id);

  console.log({ name });

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
      <div className=" bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
        <h1 className={`${notoSans.className} mb-4 text-xl md:text-2xl`}>
          {legname}
        </h1>
        <h2
          className={`${notoSans.className} mb-4 text-blue-500 text-lg md:text-xl`}
        >
          fetched LegName: {name}
        </h2>
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
