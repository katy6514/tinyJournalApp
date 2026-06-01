import { NextResponse } from "next/server";
import sql from "@/app/lib/db";

export async function GET() {
  const [datesResult, longestResult, shortestResult, statsResult] = await Promise.all([
    sql<{ date: string; entry_id: string; legname: string; state: string | null }[]>`
      SELECT d.date::text, e.id::text AS entry_id, e.legname, st.name AS state
      FROM dates d
      JOIN entries e ON e.date_id = d.id
      LEFT JOIN states st ON st.id = e.state_id
      ORDER BY d.date ASC
    `,
    sql<{ date: string; entry_id: string; legname: string; mileage: number }[]>`
      SELECT d.date::text, e.id::text AS entry_id, e.legname, l.mileage
      FROM dates d
      JOIN entries e ON e.date_id = d.id
      JOIN legs l ON d.leg_id = l.id
      WHERE l.mileage IS NOT NULL
      ORDER BY l.mileage DESC
      LIMIT 1
    `,
    sql<{ date: string; entry_id: string; legname: string; mileage: number }[]>`
      SELECT d.date::text, e.id::text AS entry_id, e.legname, l.mileage
      FROM dates d
      JOIN entries e ON e.date_id = d.id
      JOIN legs l ON d.leg_id = l.id
      WHERE l.mileage IS NOT NULL AND l.mileage > 0
      ORDER BY l.mileage ASC
      LIMIT 1
    `,
    sql<{ total_days: string; total_photos: string; start_date: string; end_date: string }[]>`
      SELECT
        COUNT(DISTINCT d.id)::text AS total_days,
        (SELECT COUNT(*)::text FROM photos) AS total_photos,
        MIN(d.date)::text AS start_date,
        MAX(d.date)::text AS end_date
      FROM dates d
      JOIN entries e ON e.date_id = d.id
    `,
  ]);

  return NextResponse.json({
    dates: datesResult,
    longestDay: longestResult[0] ?? null,
    shortestDay: shortestResult[0] ?? null,
    stats: statsResult[0] ?? null,
  });
}
