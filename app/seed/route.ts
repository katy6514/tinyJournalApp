import postgres from "postgres";
import bcrypt from "bcrypt";

import { entries } from "./cleanedEntries";
import { photos } from "./photoArray";
import { users, visitors } from "../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

/* ---------- DROP TABLES ---------- */
async function dropTables() {
  console.log("Dropping tables...");
  // await sql`DROP TABLE IF EXISTS photos CASCADE;`;
  await sql`DROP TABLE IF EXISTS entries CASCADE;`;
  await sql`DROP TABLE IF EXISTS dates CASCADE;`;
  await sql`DROP TABLE IF EXISTS users CASCADE;`;
  await sql`DROP TABLE IF EXISTS visitors CASCADE;`;
}

/* ---------- CREATE + SEED DATES ---------- */
async function seedDates() {
  console.log("Seeding dates...");

  await sql`
    CREATE TABLE dates (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE
    );
  `;

  const startDate = new Date("2024-06-16");
  const endDate = new Date("2024-10-07");
  const dates: string[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }

  for (const date of dates) {
    await sql`
      INSERT INTO dates (date)
      VALUES (${date})
      ON CONFLICT (date) DO NOTHING;
    `;
  }
}
/* ---------- CREATE + SEED ENTRIES ---------- */
async function seedEntries() {
  console.log("Seeding entries...");
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

  await sql`
    CREATE TABLE entries (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      date_id INT NOT NULL REFERENCES dates(id) ON DELETE CASCADE,
      legName VARCHAR(255) NOT NULL,
      state VARCHAR(50) NOT NULL,
      text TEXT NOT NULL
    );
  `;

  for (const entry of entries) {
    const { uuid, creationDate, text } = entry;
    const entryDate = new Date(creationDate).toISOString().split("T")[0];
    const entryText = text || "";
    const legName = "legName";
    const state = "state";

    const [{ id: dateId }] =
      await sql`SELECT id FROM dates WHERE date = ${entryDate}`;

    await sql`
      INSERT INTO entries (id, date_id, legName, state, text)
      VALUES (${uuid}, ${dateId}, ${legName}, ${state}, ${entryText})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}
/* ---------- CREATE + SEED USERS ---------- */
async function seedUsers() {
  console.log("Seeding users...");
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

  await sql`
    CREATE TABLE users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await sql`
      INSERT INTO users (id, name, email, password)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}
/* ---------- CREATE + SEED VISITORS ---------- */
async function seedVisitors() {
  console.log("Seeding visitors...");
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

  await sql`
    CREATE TABLE visitors (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  for (const visitor of visitors) {
    await sql`
      INSERT INTO visitors (id, name, email, image_url)
      VALUES (${visitor.id}, ${visitor.name}, ${visitor.email}, ${visitor.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

/* ---------- CREATE + SEED PHOTOS ---------- */
async function seedPhotos() {
  console.log("Seeding photos...");

  await sql`
    CREATE TABLE photos (
      id SERIAL PRIMARY KEY,
      src TEXT NOT NULL UNIQUE,
      width INTEGER,
      height INTEGER,
      date_id INT NOT NULL REFERENCES dates(id) ON DELETE CASCADE,
      title TEXT,
      description TEXT
    );
  `;

  for (const photo of photos) {
    const photoDate = photo.dateTime.split(" ")[0].replace(/:/g, "-"); // YYYY-MM-DD

    const dateRecord = await sql`
      SELECT id FROM dates WHERE date = ${photoDate}
    `;

    if (!dateRecord || dateRecord.length === 0) {
      console.warn(`⚠️ No date found for photo ${photo.title} (${photoDate})`);
      continue;
    }

    const date_id = dateRecord[0].id;

    await sql`
      INSERT INTO photos (src, width, height, date_id, title, description)
      VALUES (
        ${photo.src},
        ${photo.width},
        ${photo.height},
        ${date_id},
        ${photo.title},
        ${photo.description}
      )
      ON CONFLICT (src) DO NOTHING;
    `;
  }
}

//   date_id INT NOT NULL REFERENCES dates(id) ON DELETE CASCADE,
// date_id INTEGER REFERENCES dates(id),

/* ---------- MAIN SEED RUNNER ---------- */
export async function GET() {
  try {
    await dropTables(); // clean start
    await seedDates();
    await seedEntries();
    await seedUsers();
    await seedVisitors();
    // await seedPhotos();

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error(error);
    return Response.json({ error }, { status: 500 });
  }
}
