import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import sql from "@/app/lib/db";

type PhotoRow = {
  id: number;
  src: string;
  lat: number;
  lon: number;
  width: number | null;
  height: number | null;
  date_time: string | null;
  description: string | null;
};

const getPhotosGeoJSON = unstable_cache(
  async () => {
    const rows = await sql<PhotoRow[]>`
      SELECT id, src, lat, lon, width, height, date_time, description
      FROM photos
      WHERE lat IS NOT NULL AND lon IS NOT NULL
      ORDER BY date_time ASC
    `;

    const features = rows.map((row) => ({
      type: "Feature",
      geometry: {
        type: "Photo",
        coordinates: [Number(row.lon), Number(row.lat)],
      },
      properties: {
        photo_id: row.id,
        path: row.src,
        dateTime: row.date_time ?? "",
        caption: row.description ?? "",
        height: row.height ? `${row.height}px` : null,
        width: row.width ? `${row.width}px` : null,
      },
    }));

    return { type: "FeatureCollection", features };
  },
  ["photos-geojson"],
  { tags: ["photos"] },
);

export async function GET() {
  const data = await getPhotosGeoJSON();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
