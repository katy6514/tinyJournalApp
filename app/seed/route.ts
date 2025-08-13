import postgres from "postgres";
import { entries } from "./cleanedEntries";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function dropEntriesTable() {
  await sql`DROP TABLE IF EXISTS entries;`;
}

async function seedEntries() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      date DATE NOT NULL,
      legName VARCHAR(255) NOT NULL,
      state VARCHAR(50) NOT NULL,
      text TEXT NOT NULL
         );
  `;

  const insertedEntries = await Promise.all(
    entries.map(async (entry) => {
      //   const hashedPassword = await bcrypt.hash(user.password, 10);
      const { uuid, creationDate, text } = entry;
      const entryDate = new Date(creationDate).toISOString().split("T")[0];
      const entryText = text || "";
      const legName = "legName";
      const state = "state";
      return sql`
        INSERT INTO entries (id, date, legName, state, text)
        VALUES (${uuid}, ${entryDate}, ${legName}, ${state}, ${entryText})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedEntries;
}

export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      dropEntriesTable(),
      seedEntries(),
    ]);

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
