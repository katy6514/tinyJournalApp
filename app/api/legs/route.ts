import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import sql from "@/app/lib/db";

const getLegsGeoJSON = unstable_cache(
  async () => {
    const legs = await sql<
      { legnum: number; name: string; coordinates: unknown }[]
    >`
      SELECT legnum, name, coordinates
      FROM legs
      WHERE coordinates IS NOT NULL
      ORDER BY legnum ASC
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
        },
      };
    });

    return { type: "FeatureCollection", features };
  },
  ["legs-geojson"],
  { tags: ["legs"] }
);

export async function GET() {
  const data = await getLegsGeoJSON();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
