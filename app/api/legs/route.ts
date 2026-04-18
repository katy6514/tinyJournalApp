import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import sql from "@/app/lib/db";

const getLegsGeoJSON = unstable_cache(
  async () => {
    const legs = await sql<
      { legnum: number; name: string; coordinates: unknown; date: string | null; entry_id: string | null }[]
    >`
      SELECT l.legnum, l.name, l.coordinates, d.date::text, e.id::text AS entry_id
      FROM legs l
      LEFT JOIN dates d ON d.leg_id = l.id
      LEFT JOIN entries e ON e.date_id = d.id
      WHERE l.coordinates IS NOT NULL
      ORDER BY l.legnum ASC
    `;

    const features = legs.map((leg) => {
      const coords =
        typeof leg.coordinates === "string"
          ? JSON.parse(leg.coordinates)
          : leg.coordinates;
      return {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {
          title: String(leg.legnum),
          description: leg.name,
          date: leg.date ?? null,
          entry_id: leg.entry_id ?? null,
        },
      };
    });

    return { type: "FeatureCollection", features };
  },
  ["legs-geojson-v3"],
  { tags: ["legs"] }
);

export async function GET() {
  const data = await getLegsGeoJSON();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
