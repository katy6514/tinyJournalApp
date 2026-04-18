// this file is for fetching data from the database

import { JournalEntry } from "./definitions";
import sql from "./db";

// ==========================
// Fetch all states (id + name)
// ==========================
export async function fetchStates(): Promise<{ id: number; name: string }[]> {
  return await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM states ORDER BY name ASC
  `;
}

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
        e.state_id,
        st.name AS state,
        CASE WHEN e.text IS NOT NULL AND e.text <> '' THEN true ELSE false END AS has_text
      FROM dates d
      LEFT JOIN entries e ON d.id = e.date_id
      LEFT JOIN states st ON st.id = e.state_id
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
        e.state_id,
        st.name AS state,
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
      LEFT JOIN states st ON st.id = e.state_id
      LEFT JOIN photos p ON p.date_id = d.id
      WHERE e.id = ${id}
      GROUP BY d.id, d.date, e.id, e.state_id, st.name, e.legname, e.text
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
// Fetch paginated + filtered entries with photos and total page count
// ==============================================
export async function fetchFilteredEntries(
  query: string,
  currentPage: number,
): Promise<{ entries: JournalEntry[]; totalPages: number }> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const data = await sql<(JournalEntry & { total_count: string })[]>`
    SELECT
      e.id AS entry_id,
      e.text,
      e.legname,
      e.state_id,
      st.name AS state,
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
      ) AS photos,
      l.name AS assigned_leg_name,
      COUNT(*) OVER () AS total_count
    FROM entries e
    JOIN dates d ON d.id = e.date_id
    LEFT JOIN states st ON st.id = e.state_id
    LEFT JOIN photos p ON p.date_id = d.id
    LEFT JOIN legs l ON l.id = d.leg_id
    WHERE
      st.name ILIKE ${`%${query}%`} OR
      e.legname ILIKE ${`%${query}%`} OR
      e.text ILIKE ${`%${query}%`}
    GROUP BY e.id, d.id, d.date, e.text, e.legname, e.state_id, st.name, l.name
    ORDER BY d.id ASC
    LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
  `;

  const totalPages = Math.ceil(
    Number(data[0]?.total_count ?? 0) / ITEMS_PER_PAGE,
  );
  return { entries: data, totalPages };
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
// Fetch leg for a given date
// ==========================
export async function fetchLegForDateID(date_id: string) {
  try {
    const result = await sql`
      SELECT
        l.*,
        d.id AS date_id
      FROM legs l
      JOIN dates d ON d.leg_id = l.id
      WHERE d.id = ${date_id};
    `;
    return result[0];
  } catch (error) {
    console.error("Database Error (fetchLegForDateID):", error);
    throw new Error("Failed to fetch leg for the date_id.");
  }
}

// ==========================
// Fetch photos
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
// Fetch leg name for each date that has one assigned
// ==========================
export async function fetchAssignedLegs(): Promise<
  { date_id: string; name: string }[]
> {
  try {
    return await sql<{ date_id: string; name: string }[]>`
      SELECT d.id AS date_id, l.name
      FROM dates d
      JOIN legs l ON l.id = d.leg_id
      WHERE d.leg_id IS NOT NULL;
    `;
  } catch (error) {
    console.error("Database Error (fetchAssignedLegs):", error);
    throw new Error("Failed to fetch assigned legs.");
  }
}

// ==========================
// Fetch legs, THIS IS TEMP FOR ASSIGNING LEGS TO DATES
// ==========================
export async function fetchLegs(): Promise<Leg[]> {
  try {
    const result = await sql<Leg[]>`
      SELECT l.*
      FROM legs l
      WHERE
        NOT EXISTS (SELECT 1 FROM dates d WHERE d.leg_id = l.id)
        OR l.name = 'Zero Day'
      ORDER BY l.legnum ASC;
    `;

    return result;
  } catch (error) {
    console.error("Database Error (fetchLegs):", error);
    throw new Error("Failed to fetch legs.");
  }
}

// ==========================
// Fetch journal entries that have no text yet
// ==========================
export async function fetchEmptyEntries(): Promise<JournalEntry[]> {
  try {
    return await sql<JournalEntry[]>`
      SELECT
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        d.id AS date_id,
        e.id AS entry_id,
        e.text,
        e.legname,
        e.state_id,
        st.name AS state,
        false AS has_text
      FROM dates d
      LEFT JOIN entries e ON d.id = e.date_id
      LEFT JOIN states st ON st.id = e.state_id
      WHERE e.text IS NULL OR e.text = ''
      ORDER BY d.date
    `;
  } catch (error) {
    console.error("Database Error (fetchEmptyEntries):", error);
    throw new Error("Failed to fetch empty entries.");
  }
}

// ==========================
// Fetch prev/next entry IDs and dates relative to a given entry
// ==========================
export async function fetchAdjacentEntries(entry_id: string): Promise<{
  prev: { entry_id: string; date: string } | null;
  next: { entry_id: string; date: string } | null;
}> {
  const result = await sql<
    {
      prev_entry_id: string | null;
      prev_date: string | null;
      next_entry_id: string | null;
      next_date: string | null;
    }[]
  >`
    WITH ordered AS (
      SELECT
        e.id AS entry_id,
        LAG(e.id) OVER (ORDER BY d.date) AS prev_entry_id,
        LAG(TO_CHAR(d.date, 'YYYY-MM-DD')) OVER (ORDER BY d.date) AS prev_date,
        LEAD(e.id) OVER (ORDER BY d.date) AS next_entry_id,
        LEAD(TO_CHAR(d.date, 'YYYY-MM-DD')) OVER (ORDER BY d.date) AS next_date
      FROM entries e
      JOIN dates d ON d.id = e.date_id
    )
    SELECT prev_entry_id, prev_date, next_entry_id, next_date
    FROM ordered
    WHERE entry_id = ${entry_id}
  `;

  const row = result[0];
  if (!row) return { prev: null, next: null };

  return {
    prev:
      row.prev_entry_id && row.prev_date
        ? { entry_id: row.prev_entry_id, date: row.prev_date }
        : null,
    next:
      row.next_entry_id && row.next_date
        ? { entry_id: row.next_entry_id, date: row.next_date }
        : null,
  };
}

export async function fetchAllLegs(): Promise<Leg[]> {
  const result = await sql<Leg[]>`
    SELECT l.* FROM legs l ORDER BY l.legnum ASC
  `;
  return result;
}

// ==========================
// Fetch dates, , THIS IS TEMP FOR ASSIGNING LEGS TO DATES
// ==========================

// SELECT
//     d.*
//   FROM dates d
//   ORDER BY d.date;

export async function fetchDates() {
  try {
    const rawResult = await sql`
      SELECT d.*
      FROM dates d
      WHERE d.leg_id IS NULL
      ORDER BY d.date;
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
