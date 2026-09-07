import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import sql from "@/app/lib/db";
import { auth } from "@/auth";

const PREVIEW_CHARS = 160;

function previewText(text: string): string {
  if (text.length <= PREVIEW_CHARS) return text;
  const cut = text.slice(0, PREVIEW_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

const getLegsGeoJSON = unstable_cache(
  async () => {
    const legs = await sql<
      { legnum: number; name: string; coordinates: unknown; date: string | null; entry_id: string | null; text: string | null }[]
    >`
      SELECT l.legnum, l.name, l.coordinates, d.date::text, e.id::text AS entry_id, e.text
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
          text: leg.text ?? null,
        },
      };
    });

    return { type: "FeatureCollection", features };
  },
  ["legs-geojson-v4"],
  { tags: ["legs"] }
);

export async function GET() {
  const data = await getLegsGeoJSON();
  const session = await auth();

  if (session?.user) {
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // Unauthenticated: send only a short teaser of the entry text, not the full body.
  const publicData = {
    ...data,
    features: data.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        text: f.properties.text ? previewText(f.properties.text) : null,
      },
    })),
  };

  return NextResponse.json(publicData, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
