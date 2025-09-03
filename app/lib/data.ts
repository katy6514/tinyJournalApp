// this file is for fetching data from the database

import postgres from "postgres";
import { JournalEntry } from "./definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const ITEMS_PER_PAGE = 6;

// ====================================
// Fetch all journal entries, no photos
// ====================================
export async function fetchJournal(): Promise<JournalEntry[]> {
  try {
    return await sql<JournalEntry[]>`
      SELECT 
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        d.id AS date_id,
        e.id AS entry_id,
        e.text,
        e.legname,
        e.state,
        CASE WHEN e.text IS NOT NULL AND e.text <> '' THEN true ELSE false END AS has_text
      FROM dates d
      LEFT JOIN entries e ON d.id = e.date_id
      ORDER BY d.date;
    `;
  } catch (error) {
    console.error("Database Error (fetchJournal):", error);
    throw new Error("Failed to fetch journal entries.");
  }
}

// =======================================
// Fetch a single entry by ID, with photos
// =======================================
export async function fetchEntryByID(id: string): Promise<JournalEntry | null> {
  try {
    const data = await sql<JournalEntry[]>`
      SELECT
        d.id AS date_id,
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        e.id AS entry_id,
        e.state,
        e.legname,
        e.text,
        COALESCE(
          json_agg(
            json_build_object(
              'photo_id', p.id,
              'path', p.src,
              'description', p.description,
              'title', p.title,
              'width', p.width,
              'height', p.height
            ) ORDER BY p.description 
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM entries e
      LEFT JOIN dates d ON d.id = e.date_id
      LEFT JOIN photos p ON p.date_id = d.id
      WHERE e.id = ${id}
      GROUP BY d.id, d.date, e.id, e.state, e.legname, e.text
    `;

    const result = data.map((entry) => ({
      ...entry,
      date: entry.date.split("T")[0], // Convert to 'YYYY-MM-DD' format
    }));

    return result[0]; // one entry per ID
  } catch (error) {
    console.error("Database Error (fetchEntryByID):", error);
    throw new Error("Failed to fetch entry.");
  }
}

// ==============================================
// Fetch paginated + filtered entries with photos
// ==============================================
export async function fetchFilteredEntriesWithPhotos(
  query: string,
  currentPage: number
): Promise<JournalEntry[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const data = await sql<JournalEntry[]>`
      SELECT
        e.id AS entry_id,
        e.text,
        e.legname,
        e.state,
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        d.id AS date_id,
        CASE WHEN e.text IS NOT NULL AND e.text <> '' THEN true ELSE false END AS has_text,
    COALESCE(
          json_agg(
            json_build_object(
              'photo_id', p.id,
              'path', p.src,
              'description', p.description,
              'title', p.title,
              'width', p.width,
              'height', p.height
            ) ORDER BY p.description 
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM entries e
      JOIN dates d ON d.id = e.date_id
      LEFT JOIN photos p ON p.date_id = d.id
      WHERE
        e.state ILIKE ${`%${query}%`} OR
        e.legname ILIKE ${`%${query}%`} OR
        e.text ILIKE ${`%${query}%`}
      GROUP BY e.id, d.id, d.date, e.text, e.legname, e.state
      ORDER BY d.id ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset};
    `;

    const result = data.map((entry) => ({
      ...entry,
      date: entry.date.split("T")[0], // Convert to 'YYYY-MM-DD' format
    }));

    return result;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch entries.");
  }
}

// =====================================
// Fetch page count for filtered entries
// =====================================
export async function fetchJournalsPages(query: string) {
  try {
    const data = await sql`
      SELECT COUNT(DISTINCT e.id) AS total
      FROM entries e
      JOIN dates d ON d.id = e.date_id
      LEFT JOIN photos p ON p.date_id = d.id
      WHERE
        e.state ILIKE ${`%${query}%`} OR
        e.legname ILIKE ${`%${query}%`} OR
        e.text ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(data[0].total) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of filtered entries.");
  }
}

// ==========================
// Fetch photos for a given date
// ==========================
export async function fetchPhotosForDateID(date_id: string) {
  try {
    return await sql`
      SELECT 
        p.*,
        d.id AS date_id
      FROM photos p
      JOIN dates d ON d.id = p.date_id
      WHERE p.date_id = ${date_id}
      ORDER BY p.description;
    `;
  } catch (error) {
    console.error("Database Error (fetchPhotosForDateID):", error);
    throw new Error("Failed to fetch photos for the date_id.");
  }
}

// ==========================
// Fetch photos for a given date
// ==========================
export async function fetchLegForDateID(date_id: string) {
  try {
    const result = await sql`
      SELECT 
        l.*,
        d.id AS date_id
      FROM legs l
      JOIN dates d ON d.id = l.date_id
      WHERE l.date_id = ${date_id};
    `;
    return result[0];
  } catch (error) {
    console.error("Database Error (fetchLegForDateID):", error);
    throw new Error("Failed to fetch leg for the date_id.");
  }
}

// ==========================
// Fetch photos for a given date
// ==========================
export async function fetchPhotos() {
  try {
    const result = await sql`
      SELECT 
        p.*
      FROM photos p
      ORDER BY p.description;
    `;

    return result;
  } catch (error) {
    console.error("Database Error (fetchPhotos):", error);
    throw new Error("Failed to fetch photos.");
  }
}

import { Leg, DateRow } from "@/app/lib/definitions";

// ==========================
// Fetch legs
// ==========================
export async function fetchLegs(): Promise<Leg[]> {
  try {
    const result = await sql<Leg[]>`
      SELECT
        l.*
      FROM legs l
      ORDER BY l.id;
    `;

    return result;
  } catch (error) {
    console.error("Database Error (fetchLegs):", error);
    throw new Error("Failed to fetch legs.");
  }
}

// ==========================
// Fetch dates
// ==========================

export async function fetchDates() {
  try {
    const rawResult = await sql`
      SELECT d.* FROM dates d ORDER BY d.date;
    `;

    const result = rawResult.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split("T")[0], // YYYY-MM-DD
    }));

    return result;
  } catch (error) {
    console.error("Database Error (fetchDates):", error);
    throw new Error("Failed to fetch dates.");
  }
}
