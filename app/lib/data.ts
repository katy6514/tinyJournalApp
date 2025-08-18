// this file is for fetching data from the database

import postgres from "postgres";
import { JournalEntry } from "./definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchJournal() {
  try {
    const data = await sql<JournalEntry[]>` 
      SELECT 
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        d.id AS date_id,
        e.id,
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

export async function fetchEntryByID(id: string) {
  try {
    const data = await sql<JournalEntry[]>` 
      SELECT
        d.id AS date_id,
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        e.id,
        e.state,
        e.legname,
        e.text
      FROM entries e
      LEFT JOIN dates d
        ON d.id = e.date_id
      WHERE e.id = ${id};
    `;

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch entry.");
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredEntries(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const entries = await sql<JournalEntry[]>`
      SELECT
        dates.id AS date_id,
        TO_CHAR(dates.date, 'YYYY-MM-DD'),
        entries.id,
        entries.state,
        entries.legname,
        entries.text,
        CASE WHEN entries.text IS NOT NULL AND entries.text <> '' THEN true ELSE false END AS has_text
      FROM entries
      JOIN dates ON dates.id = entries.date_id
      WHERE
        entries.state ILIKE ${`%${query}%`} OR
        entries.legname ILIKE ${`%${query}%`} OR
        entries.text ILIKE ${`%${query}%`}
      ORDER BY dates.id ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return entries;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch entries.");
  }
}

export async function fetchJournalsPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
      FROM entries
      JOIN dates ON dates.id = entries.date_id
      WHERE
        entries.state ILIKE ${`%${query}%`} OR
        entries.legname ILIKE ${`%${query}%`} OR
        entries.text ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of filtered entries.");
  }
}

export async function fetchPhotosForDateID(date_id: string) {
  try {
    const data = await sql` 
      SELECT 
        photos.*,
        dates.id AS date_id
      FROM photos 
      JOIN dates ON dates.id = photos.date_id
       WHERE photos.date_id = ${date_id}
      ORDER BY photos.description;
    `;

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch photos for the date_id.");
  }
}
