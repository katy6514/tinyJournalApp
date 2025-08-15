import postgres from "postgres";
import bcrypt from "bcrypt";

import { entries } from "./cleanedEntries";
import { users, visitors } from "../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function dropEntriesTable() {
  await sql`DROP TABLE IF EXISTS entries;`;
}
async function dropDatesTable() {
  await sql`DROP TABLE IF EXISTS dates;`;
}

async function seedDates() {
  // Create the table
  await sql`
    CREATE TABLE IF NOT EXISTS dates (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE
    );
  `;

  // Generate all dates in JS
  const startDate = new Date("2024-06-16");
  const endDate = new Date("2024-10-07");
  const dates = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]); // Push a copy
  }

  // Insert them into Postgres
  const insertedDates = await Promise.all(
    dates.map(
      (date) =>
        sql`
        INSERT INTO dates (date)
        VALUES (${date})
        ON CONFLICT (date) DO NOTHING
      `
    )
  );

  return insertedDates;
}

async function seedEntries() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      date_id INT NOT NULL REFERENCES dates(id) ON DELETE CASCADE,
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

      // Look up the id for this date
      const [{ id: dateId }] =
        await sql`SELECT id FROM dates WHERE date = ${entryDate}`;

      return sql`
        INSERT INTO entries (id, date_id, legName, state, text)
        VALUES (${uuid}, ${dateId}, ${legName}, ${state}, ${entryText})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedEntries;
}

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedUsers;
}

async function seedVisitors() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS visitors (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    visitors.map(
      (visitor) => sql`
        INSERT INTO visitors (id, name, email, image_url)
        VALUES (${visitor.id}, ${visitor.name}, ${visitor.email}, ${visitor.image_url})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  return insertedCustomers;
}

export async function GET() {
  try {
    await sql.begin(async (sql) => {
      await dropEntriesTable();
      await dropDatesTable();
      await seedDates();
      await seedEntries();
      await seedUsers();
      await seedVisitors();
    });

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
