import Breadcrumbs from "@/app/ui/journal/breadcrumbs";
import React from "react";

import { Photo } from "@/app/lib/definitions"; // Assuming Photo is defined in your definitions file
import { fetchPhotos } from "@/app/lib/data";
import PhotoAlbum from "./photo-album";

export default async function Page() {
  const photosDataRaw = await fetchPhotos();

  const photosData: Photo[] = photosDataRaw.map((row) => ({
    photo_id: row.photo_id,
    date_id: row.date_id,
    path: row.src,
    width: row.width,
    height: row.height,
    description: row.description,
    title: row.title,
  }));

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Journal", href: "/journal/listView" },
          {
            label: "Photo Album",
            href: `/journal/photoAlbum`,
            active: true,
          },
        ]}
      />
      <div className="inner">
        <p>Below are some of the photos I took during my trip.</p>
      </div>

      <div
        className="inner divided"
        style={{ maxHeight: "700px", overflowY: "auto" }}
      >
        <PhotoAlbum photos={photosData} />
      </div>
    </main>
  );
}
