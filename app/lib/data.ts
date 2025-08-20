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

    return data[0]; // one entry per ID
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
    const entries = await sql<JournalEntry[]>`
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

    return entries;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch entries.");
  }
}
// Fetch one entry with photos
// export async function fetchEntryWithPhotos(id: string) {
//   const entry = await db.query(`SELECT * FROM entries WHERE id = $1`, [id]);

//   if (!entry) return null;

//   const photos = await db.query(
//     `SELECT * FROM photos WHERE date_id = $1`,
//     [entry.date_id]
//   );

//   return { ...entry, photos };
// }

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
