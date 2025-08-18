import Image from "next/image";

import { lusitana } from "@/app/ui/fonts";
import Breadcrumbs from "@/app/ui/journal/breadcrumbs";

import { fetchEntryByID, fetchPhotosForDateID } from "@/app/lib/data";

import { EditEntry } from "@/app/ui/journal/buttons";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const entries = await fetchEntryByID(id);
  const entry = Array.isArray(entries) ? entries[0] : entries;

  const { date, date_id, text, legname, state } = entry || {};

  const photos = await fetchPhotosForDateID(date_id);

  console.log({ id });
  console.log({ photos });

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "View Entry",
            href: `/journal/${id}`,
            active: true,
          },
        ]}
      />
      <div className=" bg-gray-50 p-4 md:p-6">
        <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
          single journal entry for {id}
          {legname} - {state} on {date}
          {new Date(date + "T00:00:00").toLocaleDateString()}
        </h1>
        <EditEntry id={id} />

        <div className="">
          <p>{text}</p>
        </div>
        {photos &&
          photos.map((photo) => {
            return (
              <Image
                key={photo.id}
                src={photo.src}
                width={photo.width}
                height={photo.height}
                className="block"
                alt="Photo of Katy sitting on the ground in the Wind River Range, laughing at the camera"
              />
            );
          })}
      </div>
    </main>
  );
}
