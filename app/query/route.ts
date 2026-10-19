// playground for testin queries

import postgres from "postgres";
import { auth } from "@/auth";
import { isAdminEmail } from "@/app/lib/admin";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Dev-only tool: hidden in production and limited to admins locally.
async function isAllowed() {
  if (process.env.NODE_ENV === "production") return false;
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

async function listEntries() {
  const data = await sql`
    SELECT entries.date
    FROM entries;
  `;

  return data;
}

async function listDates() {
  const data = await sql`
    SELECT *
    FROM dates
    ORDER BY date;
  `;

  return data;
}

async function listDatesWithEntries() {
  const data = await sql`
    SELECT 
      d.date,
      e.id,
      e.text
    FROM dates d
    LEFT JOIN entries e
      ON d.id = e.date_id
    ORDER BY d.date;
  `;

  return data;
}

async function listDatesWithCompleteEntries() {
  const data = await sql`
     SELECT 
      d.date,
      d.id,
      e.text,
      e.legname,
      e.state
    FROM dates d
    LEFT JOIN entries e
      ON d.id = e.date_id
    ORDER BY d.date;
  `;

  return data;
}

export async function GET() {
  if (!(await isAllowed())) {
    return new Response("Not found", { status: 404 });
  }
  try {
    return Response.json(await listDates());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
