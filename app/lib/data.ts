// this file is for fetching data from the database

import postgres from "postgres";
import { JournalEntry } from "./definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchJournal() {
  try {
    const data = await sql<JournalEntry[]>` 
      SELECT 
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        d.id,
        e.text,
        e.legname,
        e.state,
        CASE WHEN e.text IS NOT NULL AND e.text <> '' THEN true ELSE false END AS has_text

      FROM dates d
      LEFT JOIN entries e
        ON d.id = e.date_id
      ORDER BY d.date;
    `;

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch journal entries.");
  }
}
