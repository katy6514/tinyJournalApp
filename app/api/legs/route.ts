import { NextResponse } from "next/server";
import sql from "@/app/lib/db";

export async function GET() {
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

  return NextResponse.json({ type: "FeatureCollection", features });
}
