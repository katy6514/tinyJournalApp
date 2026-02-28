import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import sql from "@/app/lib/db";

const getStatesGeoJSON = unstable_cache(
  async () => {
    const states = await sql<{ name: string; geojson: unknown }[]>`
      SELECT name, geojson
      FROM states
      WHERE geojson IS NOT NULL
      ORDER BY name ASC
    `;

    const features = states.map((state) => ({
      type: "Feature",
      properties: { name: state.name },
      geometry: state.geojson,
    }));

    return { type: "FeatureCollection", features };
  },
  ["states-geojson"],
  { tags: ["states"] }
);

export async function GET() {
  const data = await getStatesGeoJSON();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
